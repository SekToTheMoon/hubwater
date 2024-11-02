const express = require("express");
const router = express.Router();
const { db } = require("../../database");
const moment = require("moment");

router.get("/quotation", function (req, res) {
  let fetch = `SELECT q.qt_id, q.qt_date, q.qt_vat, c.customer_fname,e.employee_fname, q.qt_total, q.qt_status ,q.qt_num 
      , b.bn_id , i.iv_id FROM quotation q JOIN employee e ON q.employee_id = e.employee_id JOIN customer c ON c.customer_id = q.customer_id 
      Left JOIN quotation_has_bill b on q.qt_id = b.qt_id  
      Left JOIN quotation_has_invoice i on q.qt_id = i.qt_id  
      WHERE q.qt_del = '0'`;
  let fetchValue = [];
  const page = parseInt(req.query.page);
  const per_page = parseInt(req.query.per_page);
  const sort_by = req.query.sort_by;
  const des = req.query.des;
  const search = req.query.search;
  const idx_start = (page - 1) * per_page;

  if (search) {
    fetch += ` AND (
        q.qt_id LIKE ?
        OR c.customer_fname LIKE ?
        OR q.qt_date LIKE ?
      )`;
    fetchValue = Array(3).fill(`${search}%`);
  }

  if (sort_by) {
    fetch += ` ORDER BY ${sort_by} ${des === "true" ? "DESC" : "ASC"}`;
  } else {
    fetch += ` ORDER BY qt_date DESC `;
  }

  fetch += " LIMIT ?, ?";
  fetchValue.push(idx_start);
  fetchValue.push(per_page);
  console.log(fetch);
  db.query(fetch, fetchValue, (err, result, field) => {
    if (!err) {
      db.query(
        "SELECT COUNT(qt_id) AS total FROM quotation WHERE qt_del='0'",
        (err, totalrs) => {
          if (!err) {
            const total = totalrs[0].total;
            res.json({
              data: result,
              page: page,
              per_page: per_page,
              total: total,
              total_pages: Math.ceil(total / per_page),
            });
          } else {
            res.json({ msg: "query น่าจะผิด" });
          }
        }
      );
    } else {
      res.json({ msg: err });
    }
  });
});

router.post("/quotation/insert", async (req, res) => {
  const sql = `insert into quotation (qt_id,qt_num,qt_date,qt_status,qt_credit,qt_total,qt_del,qt_detail,qt_vat,qt_tax,employee_id,customer_id,qt_dateend,disc_cash,disc_percent) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
  const next = await db
    .promise()
    .query(
      `select LPAD(IFNULL(Max(SUBSTR(qt_id, 12, 5)),0)+1,5,'0') as next from quotation where qt_date = ?;`,
      req.body.qt_date
    );
  console.log(next[0][0].next + " from next");
  const idnext =
    "QT" + moment(req.body.qt_date).format("YYYYMMDD") + "-" + next[0][0].next;
  db.query(
    sql,
    [
      idnext,
      1,
      req.body.qt_date,
      "รออนุมัติ",
      req.body.qt_credit,
      req.body.qt_total,
      "0",
      req.body.qt_detail,
      req.body.qt_vat,
      req.body.qt_tax,
      req.body.employee_id,
      req.body.customer_id,
      req.body.qt_dateend,
      req.body.disc_cash,
      req.body.disc_percent,
    ],
    (err) => {
      if (err) {
        console.log(err);
        return res
          .status(500)
          .json({ msg: "insert ข้อมูลใบเสนอราคาผิด ไม่เกี่ยวกับรายการ" });
      }
      if (req.body.items && req.body.items.length > 0) {
        let success = true; // ตั้งค่าเริ่มต้นเป็น true
        req.body.items.forEach((item, index) => {
          console.log(item);
          db.query(
            `insert into listq (listq_number,listq_price,listq_amount,listq_total,product_id,lot_number,qt_id,qt_num) values (?,?,?,?,?,?,?,?)`,
            [
              item.listq_number,
              item.product_price,
              item.listq_amount,
              item.listq_total,
              item.product_id,
              item.lot_number,
              idnext,
              1,
            ],
            (err) => {
              if (err) {
                console.log(err);
                success = false; // ถ้าเกิดข้อผิดพลาดในการเพิ่มรายการสินค้า เปลี่ยนเป็น false
              }
              // ให้ส่งการตอบกลับไปยังไคลเอนต์เมื่อวนลูปเสร็จสิ้น
              if (index === req.body.items.length - 1) {
                if (success) {
                  res.status(201).json({
                    msg: "เพิ่มใบเสนอราคาแล้ว",
                  });
                } else {
                  res.status(500).json({
                    msg: "เกิดข้อผิดพลาดในการเพิ่มรายการสินค้า",
                  });
                }
              }
            }
          );
        });
      } else {
        res.status(201).json({
          msg: "เพิ่มใบเสนอราคาแล้ว",
        });
      }
    }
  );
});

router.get("/getquotation/:id", function (req, res) {
  const quotationId = req.params.id;
  const version = req.query.version;
  const sqlQuotation = `SELECT qt_date, qt_total, qt_credit, qt_detail, qt_vat, qt_tax, qt_status, employee_id, customer_id,disc_cash,disc_percent FROM quotation WHERE qt_id = ? and qt_num = ?;`;
  db.query(sqlQuotation, [quotationId, version], (err, quotationDetail) => {
    if (err) {
      console.log(err);
      return res.json(err);
    }

    const sqlListq = `SELECT listq_number, listq_price, listq_amount, listq_total, product_id, lot_number,  qt_num FROM listq WHERE qt_id = ? and qt_num = ?;`;
    db.query(sqlListq, [quotationId, version], (err, listqDetail) => {
      if (err) {
        console.log(err);
        return res.json(err);
      }

      const productIds = listqDetail.map((item) => item.product_id);

      // ตรวจสอบว่าอาร์เรย์ productIds ไม่ว่างเปล่า
      if (productIds.length === 0) {
        return res.json({
          quotationDetail: quotationDetail,
          listbDetail: listqDetail,
          productDetail: [],
          employee_name: "",
          message: "ไม่พบสินค้าสำหรับรหัสใบเสนอราคาที่กำหนด",
        });
      }
      const sqlProduct = `SELECT product_id, product_name, product_price, product_img, unit.unit_name FROM product join unit on product.unit_id = unit.unit_id WHERE product_id IN (?);`;

      db.query(sqlProduct, [productIds], (err, productDetail) => {
        if (err) {
          console.log(err);
          return res.json(err);
        }

        const sqlEmployee_name =
          'SELECT CONCAT(employee_fname, " ", employee_lname) as employee_name FROM employee WHERE employee_id = ?;';
        db.query(
          sqlEmployee_name,
          [quotationDetail[0].employee_id],
          (err, employee_nameResult) => {
            if (err) {
              console.log(err);
              return res.json(err);
            }

            const employee_name = employee_nameResult[0].employee_name;
            return res.json({
              quotationDetail: quotationDetail,
              listqDetail: listqDetail,
              productDetail: productDetail,
              employee_name: employee_name,
            });
          }
        );
      });
    });
  });
});

router.put("/quotation/edit/:id", async (req, res) => {
  const quotationId = req.params.id;
  const oldVersion = parseInt(req.query.version);
  const version = oldVersion + 1;
  const updateQuotationSql = `insert into quotation 
  (qt_id,qt_num,qt_date,qt_status,qt_credit,
  qt_total,qt_del,qt_detail,qt_vat,
  qt_tax,employee_id,customer_id,qt_dateend,disc_cash,disc_percent)
   values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
  const SQLDeleteOldVersion =
    "update quotation set qt_del = 1 where qt_id = ? and qt_num = ? ;";

  console.log(req.body.qt_status);
  if (req.body.qt_status == "ดำเนินการแล้ว")
    return res
      .status(501)
      .json({ msg: "ไม่สามารถแก้ไขใบเสนอราคาที่ดำเนินการแล้วได้" });
  const quotationDetail = db
    .promise()
    .query(updateQuotationSql, [
      quotationId,
      version,
      req.body.qt_date,
      "รออนุมัติ",
      req.body.qt_credit,
      req.body.qt_total,
      "0",
      req.body.qt_detail,
      req.body.qt_vat,
      req.body.qt_tax,
      req.body.employee_id,
      req.body.customer_id,
      req.body.qt_dateend,
      req.body.disc_cash,
      req.body.disc_percent,
    ]);

  const DeleteOldQuotation = db
    .promise()
    .query(SQLDeleteOldVersion, [quotationId, oldVersion]);

  if (req.body.items && req.body.items.length > 0) {
    const InsertData = req.body.items.map((item, index) => {
      return db
        .promise()
        .query(
          `insert into listq (listq_number,listq_price,listq_amount,listq_total,product_id,lot_number,qt_id,qt_num) values (?,?,?,?,?,?,?,?)`,
          [
            item.listq_number,
            item.product_price,
            item.listq_amount,
            item.listq_total,
            item.product_id,
            item.lot_number,
            quotationId,
            version,
          ]
        );
    });

    try {
      await Promise.all([...InsertData, quotationDetail, DeleteOldQuotation]);
      res.status(200).json({ msg: "แก้ไขข้อมูลใบเสนอราคาสำเร็จ" });
    } catch (err) {
      console.log(err);
      res.status(500).json({ msg: "เกิดข้อผิดพลาดในการแก้ไขใบเสนอราคา" });
    }
  } else {
    res.status(201).json({
      msg: "เกิดข้อผิดพลาดกับ รายการสินค้า",
    });
  }
});

// เหลือการ auth ก่อนการ delete
router.delete("/quotation/delete/:id", (req, res) => {
  const sql = `
      UPDATE quotation 
      SET 
        qt_del = ?
      WHERE qt_id = ?;
    `;
  const id = req.params.id;
  const values = ["1", id];
  db.query(sql, values, (err, result) => {
    if (err) {
      res.status(500).json({
        msg: "Error delete department",
      });
      return;
    }
    res.status(201).json({
      msg: "ลบเรียบร้อยแล้ว",
      data: result,
    });
    return;
  });
});
module.exports = router;
