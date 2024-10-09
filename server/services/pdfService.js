const PDFDocument = require("pdfkit");
const { db } = require("../database");
const fs = require("fs");
const moment = require("moment");
const thaiBahtText = require("thai-baht-text");

exports.createPdf = async (queryData, dataCallback, endCallback) => {
  try {
    const id = queryData.id;
    let sqlSelect;
    let sqlList;
    let header;
    let tableName;
    let idField;
    let listname;
    let numberQT;

    if (id.startsWith("QT")) {
      header = `ใบเสนอราคา`;
      tableName = "quotation";
      idField = "quotation";
      listname = "listq";
      numberQT = queryData.numberQT;
      sqlSelect = `SELECT quotation_num, quotation_date, quotation_total, quotation_credit, quotation_detail, quotation_vat, quotation_tax, quotation_status, employee_id, customer_id FROM quotation WHERE quotation_id = ?;`;
      sqlList = `SELECT listq_number, listq_price, listq_amount, listq_total, lot_number,  quotation_num ,product_name FROM listq join product on listq.product_id = product.product_id WHERE quotation_id = ?;`;
    } else if (id.startsWith("BN")) {
      header = `ใบวางบิล`;
      tableName = "bill";
      idField = "bn";
      listname = "listb";
      sqlSelect = `SELECT bn_date, bn_total, bn_credit, bn_detail, bn_vat, bn_tax, employee_id, customer_id ,bn_type,bn_dateend FROM bill WHERE bn_id = ?;`;
      sqlList = `SELECT listb_number, listb_price, listb_amount, listb_total, lot_number ,product_name FROM listb join product on listb.product_id = product.product_id WHERE bn_id = ?;`;
    } else if (id.startsWith("IV")) {
      header = `ใบแจ้งหนี้`;
      tableName = "invoice";
      idField = "iv";
      listname = "listi";
      sqlSelect = `SELECT iv_date, iv_total, iv_credit, iv_detail, iv_vat, iv_tax, employee_id, customer_id ,iv_dateend FROM invoice WHERE iv_id = ?;`;
      sqlList = `SELECT listi_number, listi_price, listi_amount, listi_total, lot_number,product_name FROM listi join product on listi.product_id = product.product_id WHERE iv_id = ?;`;
    } else if (id.startsWith("RC")) {
      header = `ใบเสร็จรับเงิน`;
      tableName = "receipt";
      idField = "rc";
      listname = "listr";
      sqlSelect = `SELECT rc_date, rc_total,  rc_detail, rc_vat, rc_tax, employee_id, customer_id ,rc_type,rc_pay ,rc_payday ,bank_id FROM receipt WHERE rc_id = ?;`;
      sqlList = `SELECT listr_number, listr_price, listr_amount, listr_total, lot_number,product_name FROM listr join product on listr.product_id = product.product_id WHERE rc_id = ?;`;
      sqlBank = `SELECT bank_name,bank_num FROM bank WHERE bank_id = ?;`;
    } else if (id.startsWith("RF")) {
      header = `ใบเสร็จรับเงิน`;
      tableName = "receiptcash";
      idField = "rf";
      listname = "listrf";
      sqlSelect = `SELECT rf_date, rf_total,  rf_detail, rf_vat, rf_tax, employee_id, customer_id ,rf_pay ,bank_id FROM receiptcash WHERE rf_id = ?;`;
      sqlList = `SELECT listrf_number, listrf_price, listrf_amount, listrf_total, lot_number,product_name FROM listrf join product on listrf.product_id = product.product_id WHERE rf_id = ?;`;
      sqlBank = `SELECT bank_name,bank_num FROM bank WHERE bank_id = ?;`;
    } else {
      return;
    }

    const [result] = await db
      .promise()
      .query(sqlSelect, [id, numberQT ? numberQT : ""]);
    console.log(result);

    const [lists] = await db
      .promise()
      .query(sqlList, [id, numberQT ? numberQT : ""]);

    const [employee_nameResult] = await db
      .promise()
      .query(
        'SELECT CONCAT(employee_fname, " ", employee_lname) as employee_name FROM employee WHERE employee_id = ?;',
        [result[0]?.employee_id]
      );
    const employee_name =
      employee_nameResult[0]?.employee_name || "Cash / เงินสด";

    // ข้อมูลรายละเอียดลูกค้า
    const [customerDetails] = await db.promise().query(
      `SELECT 
    CONCAT(customer_fname, ' ', customer_lname) as customer_name,
    customer_address,
    customer_nid,
    customer_email,
    s.name as subdistrict,
    s.zip_code,
    p.name as province,
    d.name as district
    FROM 
    customer c
    LEFT JOIN 
    subdistrict s ON c.subdistrict_code = s.code
    LEFT JOIN 
    district d ON s.district_code = d.code
    LEFT JOIN 
    provinces p ON d.province_code = p.code 
    WHERE 
    customer_id = ?;
`,
      [result[0]?.customer_id]
    );
    const customer = customerDetails[0] || "ซื้อเงินสด";
    const [customerTel] = await db.promise().query(
      `SELECT 
        GROUP_CONCAT(tel SEPARATOR ', ') as tel
        FROM 
        customer_tel
        WHERE 
        customer_id = ?;`,
      [result[0]?.customer_id]
    );

    const [companyDetails] = await db.promise().query(
      `SELECT company_name, company_address, company_phone, 
        company_email, company_taxpayer ,
        s.name as subdistrict ,s.zip_code , p.name as province, d.name as district 
        FROM company c
        LEFT JOIN subdistrict s ON c.subdistrict_code = s.code
        LEFT JOIN district d ON s.district_code = d.code
        LEFT JOIN provinces p ON d.province_code = p.code;`
    );
    const company = companyDetails[0];

    let bank;
    if (id.startsWith("RC") && result[0][`${idField}_pay`] == "โอนเงิน") {
      const [bankDetail] = await db
        .promise()
        .query(sqlBank, [result[0].bank_id]);
      bank = bankDetail[0];
    }

    const total = parseFloat(result[0][`${idField}_total`]);
    const vat = total * 0.07;
    const tax = total * 0.03;
    const finalTotal = total + vat - tax;

    if (!id.startsWith("RF")) {
      const doc = new PDFDocument({ size: "A4" });

      doc.on("data", dataCallback);
      doc.on("end", endCallback);
      // pipe  คือ ส่งออก doc.pipe(res)
      // doc.pipe(fs.createWriteStream(header + id + `.pdf`));
      // สร้าง pdf ฝั่ง server เอาไว้ดู
      // Embed the Thai font

      doc.registerFont("THSarabunNew", "fonts/THSarabunNew.ttf");
      doc.font("THSarabunNew");

      doc.fontSize(20).text(header, 360, 40, { width: 150, align: "center" });

      doc
        .fontSize(15)
        .text("ต้นฉบับ", 360, 60, { width: 150, align: "center" });

      // หัวข้อทางด้านซ้าย
      const leftSide = 48;
      doc.image("img/logo/logo.png", leftSide, 46, { fit: [100, 30] });
      doc.fontSize(13).text(company.company_name, leftSide, 80);
      doc.fontSize(12).text(company.company_address, leftSide, 93);
      doc.text(
        company.subdistrict +
          " " +
          company.district +
          " " +
          company.province +
          " " +
          company.zip_code,
        leftSide,
        106
      );
      doc.text(
        "เลขประจำตัวผู้เสียภาษี " + company.company_taxpayer,
        leftSide,
        119
      );
      doc.text(
        "โทร. " + company.company_phone + " อีเมล " + company.company_email,
        leftSide,
        132
      );

      //ลูกค้า
      doc.fontSize(13).text("ลูกค้า: " + customer.customer_name, leftSide, 150);
      doc
        .fontSize(12)
        .text(
          customer.customer_address +
            " " +
            customer.subdistrict +
            " " +
            customer.district +
            " " +
            customer.province +
            " " +
            customer.zip_code,
          leftSide,
          163
        );

      doc.text(
        "เลขประจำตัวผู้เสียภาษี " + customer.customer_nid,
        leftSide,
        176
      );
      doc.text(
        "โทร. " + customerTel[0].tel + " อีเมล " + customer.customer_email,
        leftSide,
        189
      );

      //หัวข้อทางด้านขวา
      const rightSideTop = 360;
      const rightSide = 370;
      doc
        .lineCap("butt")
        .moveTo(rightSideTop - 10, 85)
        .lineTo(520, 85)
        .stroke();
      doc.fontSize(13).text("เลขที่", rightSideTop, 90);
      doc.text(id, rightSideTop + 45, 90);
      doc.text("วันที่", rightSideTop, 110);
      doc.text(
        moment(result[0][`${idField}_date`]).format("DD-MM-YYYY"),
        rightSideTop + 45,
        110
      );
      if (result[0][`${idField}_credit`]) {
        doc.text("เครดิต", rightSideTop, 130);
        doc.text(result[0][`${idField}_credit`], rightSideTop + 45, 130);
        doc.text("ผู้ขาย", rightSideTop, 150);
        doc.text(employee_name, rightSideTop + 45, 150);
        doc.text(":", rightSideTop + 30, 150);
        doc
          .lineCap("butt")
          .moveTo(rightSideTop - 10, 170)
          .lineTo(520, 170)
          .stroke();
      } else {
        doc.text("ผู้ขาย", rightSideTop, 130);
        doc.text(employee_name, rightSideTop + 45, 130);
        doc
          .lineCap("butt")
          .moveTo(rightSideTop - 10, 150)
          .lineTo(520, 150)
          .stroke();
      }

      let hight = 90;

      for (let index = 0; index < 3; index++) {
        doc.text(":", rightSideTop + 30, hight);
        hight += 20;
      }
      // ส่วนตาราง --------------------------------------------------------
      //ความสูงของบตารารางเป็นต้นไป
      let y = 218;
      let rowHeight = 20;
      const tableStartY = y;

      // ตำแหน่งตารางแนวตั้งของตาราง
      let xPositions = [leftSide, 76, 180, 320, 395, 440, 520];

      // หัวข้อตาราง
      doc.text("ลำดับ", xPositions[0], y + 2, { width: 28, align: "center" });
      doc.text("ชื่อสินค้า", xPositions[1], y + 2, {
        width: 104,
        align: "center",
      });
      doc.text("เลขล็อต", xPositions[2], y + 2, {
        width: 140,
        align: "center",
      });
      doc.text("ราคาต่อหน่วย", xPositions[3], y + 2, {
        width: 75,
        align: "center",
      });
      doc.text("จำนวน", xPositions[4], y + 2, { width: 45, align: "center" });
      doc.text("ยอดรวม", xPositions[5], y + 2, { width: 80, align: "center" });

      // เส้นตารางแนวนอน (เส้นหัวข้อตาราง)
      doc.moveTo(leftSide, y).lineTo(520, y).stroke();

      lists.forEach((item, index) => {
        doc.text(item[`${listname}_number`], xPositions[0], y + 22, {
          width: 28,
          align: "center",
        });
        doc.text(item.product_name, xPositions[1], y + 22, {
          width: 104,
          align: "center",
        });
        doc.text(item.lot_number, xPositions[2], y + 22, {
          width: 140,
          align: "center",
        });
        doc.text(item[`${listname}_price`], xPositions[3], y + 22, {
          width: 72,
          align: "right",
        });
        doc.text(item[`${listname}_amount`], xPositions[4], y + 22, {
          width: 42,
          align: "right",
        });
        doc.text(item[`${listname}_total`], xPositions[5], y + 22, {
          width: 77,
          align: "right",
        });

        // เส้นตารางแนวนอน (แต่ละแถว)
        doc
          .moveTo(leftSide, y + rowHeight)
          .lineTo(520, y + rowHeight)
          .stroke();

        y += rowHeight;
      });
      //เส้นปิดท้ายตาราง
      doc
        .moveTo(leftSide, y + rowHeight)
        .lineTo(520, y + rowHeight)
        .stroke();

      //สร้างเส้นแนวตั้งปิดท้ายตาราง
      xPositions.forEach((x) => {
        doc
          .moveTo(x, tableStartY)
          .lineTo(x, y + rowHeight)
          .stroke();
      });

      // ส่วนท้ายตาราง -------------------------------------
      doc.text("รวมเป็นเงิน", rightSide, y + 40);
      doc.text(
        result[0][`${idField}_total`] + " บาท",
        rightSide + 100,
        y + 40,
        {
          align: "right",
        }
      );
      doc.text("ภาษีมูลค่าเพิ่ม 7%", rightSide, y + 60);

      doc.text(
        result[0][`${idField}_vat`] ? `${vat.toFixed(0)} บาท` : "0 บาท",
        rightSide + 100,
        y + 60,
        {
          align: "right",
        }
      );

      doc.text("จำนวนเงินรวมทั้งสิ้น", rightSide, y + 80);
      doc.text(
        result[0][`${idField}_vat`]
          ? `${(total * 1.07).toFixed(0)} บาท`
          : result[0][`${idField}_total`] + " บาท",
        rightSide + 100,
        y + 80,
        { align: "right" }
      );

      if (result[0][`${idField}_tax`]) {
        doc.text("หักภาษี ณ ที่จ่าย 3%", rightSide, y + 100);
        doc.text(`${tax.toFixed(0)} บาท`, rightSide + 100, y + 100, {
          align: "right",
        });
        doc.text("ยอดชำระ", rightSide, y + 120);
        doc.text(`${finalTotal.toFixed(0)} บาท`, rightSide + 100, y + 120, {
          align: "right",
        });
        doc.text(`(${thaiBahtText(finalTotal.toFixed(0))})`, leftSide, y + 120);
      } else if (result[0][`${idField}_vat`]) {
        doc.text(
          `(${thaiBahtText((total * 1.07).toFixed(0))})`,
          leftSide,
          y + 80
        );
      } else {
        doc.text(`(${thaiBahtText(total.toFixed(0))} )`, leftSide, y + 80);
      }

      // ส่วนท้ายในใบต่างๆ ----------------------------------------
      // ด้านซ้าย

      if (id.startsWith("RC")) {
        doc.text(
          `การชำระเงินจะสมบูรณ์เมื่อบริษัทได้รับเงินเรียบร้อยแล้ว`,
          leftSide,
          610
        );
        doc.text(`เงินสด`, leftSide + 233, 610);
        doc.text(`โอนเงิน`, leftSide + 283, 610);
        for (let i = 220; i < 310; i += 50) {
          doc
            .lineJoin("round")
            .rect(leftSide + i, 613, 10, 10)
            .stroke();
        }
        if (result[0][`${idField}_pay`]) {
          if (result[0][`${idField}_pay`] == "เงินสด") {
            doc
              .lineCap("butt")
              .moveTo(leftSide + 221, 614)
              .lineTo(leftSide + 225, 621)
              .lineTo(leftSide + 232, 610)
              .stroke();
          } else {
            doc
              .lineCap("butt")
              .moveTo(leftSide + 271, 614)
              .lineTo(leftSide + 275, 621)
              .lineTo(leftSide + 282, 610)
              .stroke();
            doc.text(bank.bank_name, leftSide + 32, 637, {
              width: 106,
              align: "center",
            });
            doc.text(bank.bank_num, leftSide + 162, 637, {
              width: 98,
              align: "center",
            });
          }
        }

        doc.text(`ธนาคาร`, leftSide, 637);
        doc
          .lineCap("butt")
          .moveTo(leftSide + 32, 651)
          .lineTo(leftSide + 138, 651)
          .stroke();
        doc.text(`เลขที่`, leftSide + 140, 637);
        doc
          .lineCap("butt")
          .moveTo(leftSide + 162, 651)
          .lineTo(leftSide + 260, 651)
          .stroke();
        doc.text(`วันที่`, leftSide + 263, 637);
        doc.text(
          moment(result[0].rc_payday).format("DD/MM/YYYY"),
          leftSide + 282,
          637,
          { width: 83, align: "center" }
        );
        doc
          .lineCap("butt")
          .moveTo(leftSide + 282, 651)
          .lineTo(leftSide + 363, 651)
          .stroke();
        doc.text(`จำนวนเงิน`, leftSide + 365, 637);
        doc.text(result[0].rc_total, leftSide + 410, 637, {
          width: 65,
          align: "center",
        });
        doc
          .lineCap("butt")
          .moveTo(leftSide + 410, 651)
          .lineTo(leftSide + 475, 651)
          .stroke();
      }
      // ด้านซ้าย
      doc.text("ในนาม  " + customer.customer_name, leftSide, 670);
      doc
        .lineCap("butt")
        .moveTo(leftSide, 740)
        .lineTo(leftSide + 80, 740)
        .stroke();

      doc
        .lineCap("butt")
        .moveTo(leftSide + 100, 740)
        .lineTo(leftSide + 180, 740)
        .stroke();

      doc.text("ผู้สั่งซื้อสินค้า  ", leftSide + 15, 750);
      doc.text("วันที่", leftSide + 130, 750);

      // ด้านขวา
      doc.text("ในนาม บริษัท ฮับวอเตอร์เทค", 0, 670, { align: "right" });
      doc
        .lineCap("butt")
        .moveTo(rightSide - 25, 740)
        .lineTo(rightSide + 55, 740)
        .stroke();
      doc.image("img/signature/signature.png", rightSide + -25, 694, {
        cover: [80, 38],
      });
      doc
        .lineCap("butt")
        .moveTo(rightSide + 75, 740)
        .lineTo(rightSide + 155, 740)
        .stroke();
      doc.text("ผู้อนุมัติ", rightSide + 3, 750);

      doc.text(moment(new Date()).format("DD/MM/YYYY"), rightSide + 75, 720, {
        width: 80,
        align: "center",
      });
      doc.text("วันที่", rightSide + 106, 750);
      if (!(id.startsWith("QT") || id.startsWith("RF"))) {
        doc.addPage();
        doc.fontSize(20).text(header, 360, 40, { width: 150, align: "center" });

        doc
          .fontSize(15)
          .text("สำเนา", 360, 60, { width: 150, align: "center" });

        // หัวข้อทางด้านซ้าย
        const leftSide = 48;
        doc.image("img/logo/logo.png", leftSide, 46, { fit: [100, 30] });
        doc.fontSize(13).text(company.company_name, leftSide, 80);
        doc.fontSize(12).text(company.company_address, leftSide, 93);
        doc.text(
          company.subdistrict +
            " " +
            company.district +
            " " +
            company.province +
            " " +
            company.zip_code,
          leftSide,
          106
        );
        doc.text(
          "เลขประจำตัวผู้เสียภาษี " + company.company_taxpayer,
          leftSide,
          119
        );
        doc.text(
          "โทร. " + company.company_phone + " อีเมล " + company.company_email,
          leftSide,
          132
        );

        //ลูกค้า
        doc
          .fontSize(13)
          .text("ลูกค้า: " + customer.customer_name, leftSide, 150);
        doc
          .fontSize(12)
          .text(
            customer.customer_address +
              " " +
              customer.subdistrict +
              " " +
              customer.district +
              " " +
              customer.province +
              " " +
              customer.zip_code,
            leftSide,
            163
          );

        doc.text(
          "เลขประจำตัวผู้เสียภาษี " + customer.customer_nid,
          leftSide,
          176
        );
        doc.text(
          "โทร. " + customerTel[0].tel + " อีเมล " + customer.customer_email,
          leftSide,
          189
        );

        //หัวข้อทางด้านขวา
        const rightSideTop = 360;
        const rightSide = 370;
        doc
          .lineCap("butt")
          .moveTo(rightSideTop - 10, 85)
          .lineTo(520, 85)
          .stroke();
        doc.fontSize(13).text("เลขที่", rightSideTop, 90);
        doc.text(id, rightSideTop + 45, 90);
        doc.text("วันที่", rightSideTop, 110);
        doc.text(
          moment(result[0][`${idField}_date`]).format("DD-MM-YYYY"),
          rightSideTop + 45,
          110
        );
        if (result[0][`${idField}_credit`]) {
          doc.text("เครดิต", rightSideTop, 130);
          doc.text(result[0][`${idField}_credit`], rightSideTop + 45, 130);
          doc.text("ผู้ขาย", rightSideTop, 150);
          doc.text(employee_name, rightSideTop + 45, 150);
          doc.text(":", rightSideTop + 30, 150);
          doc
            .lineCap("butt")
            .moveTo(rightSideTop - 10, 170)
            .lineTo(520, 170)
            .stroke();
        } else {
          doc.text("ผู้ขาย", rightSideTop, 130);
          doc.text(employee_name, rightSideTop + 45, 130);
          doc
            .lineCap("butt")
            .moveTo(rightSideTop - 10, 150)
            .lineTo(520, 150)
            .stroke();
        }

        let hight = 90;

        for (let index = 0; index < 3; index++) {
          doc.text(":", rightSideTop + 30, hight);
          hight += 20;
        }
        // ส่วนตาราง --------------------------------------------------------
        //ความสูงของบตารารางเป็นต้นไป
        let y = 218;
        let rowHeight = 20;
        const tableStartY = y;

        // ตำแหน่งตารางแนวตั้งของตาราง
        let xPositions = [leftSide, 76, 180, 320, 395, 440, 520];

        // หัวข้อตาราง
        doc.text("ลำดับ", xPositions[0], y + 2, { width: 28, align: "center" });
        doc.text("ชื่อสินค้า", xPositions[1], y + 2, {
          width: 104,
          align: "center",
        });
        doc.text("เลขล็อต", xPositions[2], y + 2, {
          width: 140,
          align: "center",
        });
        doc.text("ราคาต่อหน่วย", xPositions[3], y + 2, {
          width: 75,
          align: "center",
        });
        doc.text("จำนวน", xPositions[4], y + 2, { width: 45, align: "center" });
        doc.text("ยอดรวม", xPositions[5], y + 2, {
          width: 80,
          align: "center",
        });

        // เส้นตารางแนวนอน (เส้นหัวข้อตาราง)
        doc.moveTo(leftSide, y).lineTo(520, y).stroke();

        lists.forEach((item, index) => {
          doc.text(item[`${listname}_number`], xPositions[0], y + 22, {
            width: 28,
            align: "center",
          });
          doc.text(item.product_name, xPositions[1], y + 22, {
            width: 104,
            align: "center",
          });
          doc.text(item.lot_number, xPositions[2], y + 22, {
            width: 140,
            align: "center",
          });
          doc.text(item[`${listname}_price`], xPositions[3], y + 22, {
            width: 72,
            align: "right",
          });
          doc.text(item[`${listname}_amount`], xPositions[4], y + 22, {
            width: 42,
            align: "right",
          });
          doc.text(item[`${listname}_total`], xPositions[5], y + 22, {
            width: 77,
            align: "right",
          });

          // เส้นตารางแนวนอน (แต่ละแถว)
          doc
            .moveTo(leftSide, y + rowHeight)
            .lineTo(520, y + rowHeight)
            .stroke();

          y += rowHeight;
        });
        //เส้นปิดท้ายตาราง
        doc
          .moveTo(leftSide, y + rowHeight)
          .lineTo(520, y + rowHeight)
          .stroke();

        //สร้างเส้นแนวตั้งปิดท้ายตาราง
        xPositions.forEach((x) => {
          doc
            .moveTo(x, tableStartY)
            .lineTo(x, y + rowHeight)
            .stroke();
        });

        // ส่วนท้ายตาราง -------------------------------------
        doc.text("รวมเป็นเงิน", rightSide, y + 40);
        doc.text(
          result[0][`${idField}_total`] + " บาท",
          rightSide + 100,
          y + 40,
          {
            align: "right",
          }
        );
        doc.text("ภาษีมูลค่าเพิ่ม 7%", rightSide, y + 60);

        doc.text(
          result[0][`${idField}_vat`] ? `${vat.toFixed(0)} บาท` : "0 บาท",
          rightSide + 100,
          y + 60,
          {
            align: "right",
          }
        );

        doc.text("จำนวนเงินรวมทั้งสิ้น", rightSide, y + 80);
        doc.text(
          result[0][`${idField}_vat`]
            ? `${(total * 1.07).toFixed(0)} บาท`
            : result[0][`${idField}_total`] + " บาท",
          rightSide + 100,
          y + 80,
          { align: "right" }
        );

        if (result[0][`${idField}_tax`]) {
          doc.text("หักภาษี ณ ที่จ่าย 3%", rightSide, y + 100);
          doc.text(`${tax.toFixed(0)} บาท`, rightSide + 100, y + 100, {
            align: "right",
          });
          doc.text("ยอดชำระ", rightSide, y + 120);
          doc.text(`${finalTotal.toFixed(0)} บาท`, rightSide + 100, y + 120, {
            align: "right",
          });
          doc.text(
            `(${thaiBahtText(finalTotal.toFixed(0))})`,
            leftSide,
            y + 120
          );
        } else if (result[0][`${idField}_vat`]) {
          doc.text(
            `(${thaiBahtText((total * 1.07).toFixed(0))})`,
            leftSide,
            y + 80
          );
        } else {
          doc.text(`(${thaiBahtText(total.toFixed(0))} )`, leftSide, y + 80);
        }

        // ส่วนท้ายในใบต่างๆ ----------------------------------------
        // ด้านซ้าย

        if (id.startsWith("RC")) {
          doc.text(
            `การชำระเงินจะสมบูรณ์เมื่อบริษัทได้รับเงินเรียบร้อยแล้ว`,
            leftSide,
            610
          );
          doc.text(`เงินสด`, leftSide + 233, 610);
          doc.text(`โอนเงิน`, leftSide + 283, 610);
          for (let i = 220; i < 310; i += 50) {
            doc
              .lineJoin("round")
              .rect(leftSide + i, 613, 10, 10)
              .stroke();
          }
          if (result[0][`${idField}_pay`]) {
            if (result[0][`${idField}_pay`] == "เงินสด") {
              doc
                .lineCap("butt")
                .moveTo(leftSide + 221, 614)
                .lineTo(leftSide + 225, 621)
                .lineTo(leftSide + 232, 610)
                .stroke();
            } else {
              doc
                .lineCap("butt")
                .moveTo(leftSide + 271, 614)
                .lineTo(leftSide + 275, 621)
                .lineTo(leftSide + 282, 610)
                .stroke();
              doc.text(bank.bank_name, leftSide + 32, 637, {
                width: 106,
                align: "center",
              });
              doc.text(bank.bank_num, leftSide + 162, 637, {
                width: 98,
                align: "center",
              });
            }
          }

          doc.text(`ธนาคาร`, leftSide, 637);
          doc
            .lineCap("butt")
            .moveTo(leftSide + 32, 651)
            .lineTo(leftSide + 138, 651)
            .stroke();
          doc.text(`เลขที่`, leftSide + 140, 637);
          doc
            .lineCap("butt")
            .moveTo(leftSide + 162, 651)
            .lineTo(leftSide + 260, 651)
            .stroke();
          doc.text(`วันที่`, leftSide + 263, 637);
          doc.text(
            moment(result[0].rc_payday).format("DD/MM/YYYY"),
            leftSide + 282,
            637,
            { width: 83, align: "center" }
          );
          doc
            .lineCap("butt")
            .moveTo(leftSide + 282, 651)
            .lineTo(leftSide + 363, 651)
            .stroke();
          doc.text(`จำนวนเงิน`, leftSide + 365, 637);
          doc.text(result[0].rc_total, leftSide + 410, 637, {
            width: 65,
            align: "center",
          });
          doc
            .lineCap("butt")
            .moveTo(leftSide + 410, 651)
            .lineTo(leftSide + 475, 651)
            .stroke();
        }
        // ด้านซ้าย
        doc.text("ในนาม  " + customer.customer_name, leftSide, 670);
        doc
          .lineCap("butt")
          .moveTo(leftSide, 740)
          .lineTo(leftSide + 80, 740)
          .stroke();

        doc
          .lineCap("butt")
          .moveTo(leftSide + 100, 740)
          .lineTo(leftSide + 180, 740)
          .stroke();

        doc.text("ผู้สั่งซื้อสินค้า  ", leftSide + 15, 750);
        doc.text("วันที่", leftSide + 130, 750);

        // ด้านขวา
        doc.text("ในนาม บริษัท ฮับวอเตอร์เทค", 0, 670, { align: "right" });
        doc
          .lineCap("butt")
          .moveTo(rightSide - 25, 740)
          .lineTo(rightSide + 55, 740)
          .stroke();
        doc.image("img/signature/signature.png", rightSide + -25, 694, {
          cover: [80, 38],
        });
        doc
          .lineCap("butt")
          .moveTo(rightSide + 75, 740)
          .lineTo(rightSide + 155, 740)
          .stroke();
        doc.text("ผู้อนุมัติ", rightSide + 3, 750);

        doc.text(moment(new Date()).format("DD/MM/YYYY"), rightSide + 75, 720, {
          width: 80,
          align: "center",
        });
        doc.text("วันที่", rightSide + 106, 750);
      }
      doc.end();
    } else {
      const optionPDF = (position = "center", width = 186) => {
        return { align: position, width: width };
      };

      try {
        const doc = new PDFDocument({
          size: [226.772, 3000],
        });
        doc.on("data", dataCallback);
        doc.on("end", endCallback);
        // doc.pipe(fs.createWriteStream(header + id + `.pdf`));

        doc.registerFont("THSarabunNew", "fonts/THSarabunNew.ttf");
        doc.font("THSarabunNew");

        // set ความหนาของเส้น
        doc.lineWidth(0.5);

        // หัวใบเสร็จ
        doc.fontSize(12).text(company.company_name, 20.386, 35, optionPDF());
        doc.text("(สำนักงานใหญ่)", optionPDF());
        doc.text(`โทร: ${company.company_phone}`, optionPDF());
        // เส้นกั้นใบเสร็จ
        doc.lineCap("butt").moveTo(20.386, 83).lineTo(206.386, 83).stroke();
        // เลขที่ใบเสร็จและวันที่
        doc.text("ใบกำกับภาษีอย่างย่อ/ใบเสร็จรับเงิน", 20.386, 87);
        doc.text(`เลขที่: ${id}`);
        // เส้นกั้นใบเสร็จ
        doc
          .lineCap("butt")
          .moveTo(20.386, 119)
          .lineTo(206.386, 119)
          .dash(2, { space: 0.7 })
          .stroke();
        doc.text(`พนักงานขาย: ${employee_name}`, 20.386, 122);
        doc.text(
          `วันที่: ${moment(result[0][`${idField}_date`]).format(
            "DD/MM/YYYY"
          )}`,
          { align: "left" }
        );

        doc.moveDown(0.4);
        // เส้นกั้นใบเสร็จ
        doc
          .lineCap("butt")
          .moveTo(20.386, 153)
          .lineTo(206.386, 153)
          .dash(206.386)
          .stroke();

        // รายการสินค้า
        lists.forEach((item, index) => {
          doc
            .text(`${item[`${listname}_amount`]}  `, {
              continued: true,
              width: 186,
            })
            .text(`${item.product_name}`, { continued: true })
            .text(`${item[`${listname}_total`]}`, { align: "right" });
        });
        doc.text(
          `-----------------------------------------------------------------------`,
          optionPDF()
        );

        // สรุปยอด
        const total = parseFloat(result[0][`${idField}_total`]);
        const vat = result[0][`${idField}_vat`] ? total * 0.07 : 0;
        const finalTotal = total + vat;

        let yNow = doc.y;
        doc.text("รวมเป็นเงิน", 80, yNow, {
          align: "right",
        });
        doc.text(`${total.toFixed(2)}`, 20.386, yNow, optionPDF("right"));

        yNow += 15;
        if (vat > 0) {
          doc.text("ภาษีมูลค่าเพิ่ม 7%", 80, yNow, { align: "right" });
          doc.text(`${vat.toFixed(2)}`, 20.386, yNow, optionPDF("right"));
        }
        yNow += 15;
        doc.text(`${finalTotal.toFixed(2)}`, 20.386, yNow, {
          align: "right",
          width: 186,
          underline: true,
        });
        doc.text("ยอดรวมสุทธิ", 80, yNow, {
          align: "right",
        });
        // ข้อความขอบคุณ
        doc.moveDown();
        doc.fontSize(10).text("ขอบคุณที่ใช้บริการ", { align: "center" });
        doc.page.height = doc.y + 20;
        doc.end();
      } catch (err) {
        console.log(err);
      }
    }
  } catch (err) {
    console.error(err);
  }
};
