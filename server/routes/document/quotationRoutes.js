const express = require("express");
const router = express.Router();
const { db } = require("../../database");
const moment = require("moment");

router.get("/quotation", function (req, res) {
  let fetch = `SELECT q.quotation_id, q.quotation_date, q.quotation_vat, c.customer_fname,e.employee_fname, q.quotation_total, q.quotation_status ,q.quotation_num 
      , b.bn_id , i.iv_id FROM quotation q JOIN employee e ON q.employee_id = e.employee_id JOIN customer c ON c.customer_id = q.customer_id 
      Left JOIN quotation_has_bill b on q.quotation_id = b.quotation_id  
      Left JOIN quotation_has_invoice i on q.quotation_id = i.quotation_id  
      WHERE q.quotation_del = '0'`;
  let fetchValue = [];
  const page = parseInt(req.query.page);
  const per_page = parseInt(req.query.per_page);
  const sort_by = req.query.sort_by;
  const sort_type = req.query.sort_type;
  const search = req.query.search;
  const idx_start = (page - 1) * per_page;

  if (search) {
    fetch += ` AND (
        q.quotation_id LIKE ?
        OR c.customer_fname LIKE ?
        OR q.quotation_date LIKE ?
      )`;
    fetchValue = Array(3).fill(`${search}%`);
  }

  if (sort_by && sort_type) {
    fetch += " ORDER BY " + sort_by + " " + sort_type;
  }

  fetch += " LIMIT ?, ?";
  fetchValue.push(idx_start);
  fetchValue.push(per_page);

  db.execute(fetch, fetchValue, (err, result, field) => {
    if (!err) {
      db.query(
        "SELECT COUNT(quotation_id) AS total FROM quotation WHERE quotation_del='0'",
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
  const sql = `insert into quotation (quotation_id,quotation_num,quotation_date,quotation_status,quotation_credit,quotation_total,quotation_del,quotation_detail,quotation_vat,quotation_tax,employee_id,customer_id,quotation_dateend,disc_cash,disc_percent) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
  const next = await db
    .promise()
    .query(
      `select LPAD(IFNULL(Max(SUBSTR(quotation_id, 12, 5)),0)+1,5,'0') as next from quotation where quotation_date = ?;`,
      req.body.quotation_date
    );
  console.log(next[0][0].next + " from next");
  const idnext =
    "QT" +
    moment(req.body.quotation_date).format("YYYYMMDD") +
    "-" +
    next[0][0].next;
  db.query(
    sql,
    [
      idnext,
      1,
      req.body.quotation_date,
      "รออนุมัติ",
      req.body.quotation_credit,
      req.body.quotation_total,
      "0",
      req.body.quotation_detail,
      req.body.quotation_vat,
      req.body.quotation_tax,
      req.body.employee_id,
      req.body.customer_id,
      req.body.quotation_dateend,
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
            `insert into listq (listq_number,listq_price,listq_amount,listq_total,product_id,lot_number,quotation_id,quotation_num) values (?,?,?,?,?,?,?,?)`,
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
  const sqlQuotation = `SELECT quotation_date, quotation_total, quotation_credit, quotation_detail, quotation_vat, quotation_tax, quotation_status, employee_id, customer_id,disc_cash,disc_percent FROM quotation WHERE quotation_id = ? and quotation_num = ?;`;
  db.query(sqlQuotation, [quotationId, version], (err, quotationDetail) => {
    if (err) {
      console.log(err);
      return res.json(err);
    }

    const sqlListq = `SELECT listq_number, listq_price, listq_amount, listq_total, product_id, lot_number,  quotation_num FROM listq WHERE quotation_id = ? and quotation_num = ?;`;
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
  (quotation_id,quotation_num,quotation_date,quotation_status,quotation_credit,
  quotation_total,quotation_del,quotation_detail,quotation_vat,
  quotation_tax,employee_id,customer_id,quotation_dateend,disc_cash,disc_percent)
   values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
  const SQLDeleteOldVersion =
    "update quotation set quotation_del = 1 where quotation_id = ? and quotation_num = ? ;";

  console.log(req.body.quotation_status);
  if (req.body.quotation_status == "ดำเนินการแล้ว")
    return res
      .status(501)
      .json({ msg: "ไม่สามารถแก้ไขใบเสนอราคาที่ดำเนินการแล้วได้" });
  const quotationDetail = db
    .promise()
    .query(updateQuotationSql, [
      quotationId,
      version,
      req.body.quotation_date,
      "รออนุมัติ",
      req.body.quotation_credit,
      req.body.quotation_total,
      "0",
      req.body.quotation_detail,
      req.body.quotation_vat,
      req.body.quotation_tax,
      req.body.employee_id,
      req.body.customer_id,
      req.body.quotation_dateend,
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
          `insert into listq (listq_number,listq_price,listq_amount,listq_total,product_id,lot_number,quotation_id,quotation_num) values (?,?,?,?,?,?,?,?)`,
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

// router.put("/quotation/edit/:id", async (req, res) => {
//   const quotationId = req.params.id;

//   const updateQuotationSql = `UPDATE quotation
//                                 SET quotation_date = ?, quotation_credit = ?, quotation_total = ?, quotation_detail = ?,
//                                     quotation_vat = ?, quotation_tax = ?, employee_id = ?, customer_id = ?, quotation_dateend = ?
//                                 WHERE quotation_id = ?`;

//   db.query(
//     updateQuotationSql,
//     [
//       req.body.quotation_date,
//       req.body.quotation_credit,
//       req.body.quotation_total,
//       req.body.quotation_detail,
//       req.body.quotation_vat,
//       req.body.quotation_tax,
//       req.body.employee_id,
//       req.body.customer_id,
//       req.body.quotation_dateend,
//       quotationId,
//     ],
//     async (err) => {
//       if (err) {
//         console.log(err);
//         return res.status(500).json({ msg: "Update ข้อมูลใบเสนอราคาผิดพลาด" });
//       }

//       const sqlListq = `SELECT listq_number,
//         product_id
//                           FROM listq WHERE quotation_id = ?`;

//       const [existingItems] = await db.promise().query(sqlListq, [quotationId]);

//       const existingItemMap = new Map();
//       existingItems.forEach((item) => {
//         const key = `${item.product_id}-${item.listq_number}`;
//         existingItemMap.set(key, item);
//       });

//       const newItemMap = new Map();
//       req.body.items.forEach((item) => {
//         const key = `${item.product_id}-${item.listq_number}`;
//         newItemMap.set(key, item);
//       });

//       const toInsert = [];
//       const toUpdate = [];
//       const toDelete = [];

//       newItemMap.forEach((item, key) => {
//         if (existingItemMap.has(key)) {
//           toUpdate.push(item);
//           existingItemMap.delete(key);
//         } else {
//           toInsert.push(item);
//         }
//       });
//       console.log(toUpdate);

//       existingItemMap.forEach((item, key) => {
//         toDelete.push(item);
//       });

//       const insertPromises = toInsert.map((item, index) => {
//         return db.promise().query(
//           `INSERT INTO listq (listq_number, listq_price, listq_amount, listq_total, product_id, lot_number, quotation_id, quotation_num)
//              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//           [
//             item.listq_number,
//             item.product_price,
//             item.listq_amount,
//             item.listq_total,
//             item.product_id,
//             item.lot_number,
//             quotationId,
//             1,
//           ]
//         );
//       });

//       const updatePromises = toUpdate.map((item) => {
//         return db.promise().query(
//           `UPDATE listq SET listq_price = ?, listq_amount = ?, listq_total = ?, lot_number = ?
//              WHERE listq_number = ? AND quotation_id = ?`,
//           [
//             item.listq_price,
//             item.listq_amount,
//             item.listq_total,
//             item.lot_number,
//             item.listq_number,
//             quotationId,
//           ]
//         );
//       });

//       const deletePromises = toDelete.map((item) => {
//         return db
//           .promise()
//           .query(
//             `DELETE FROM listq WHERE listq_number = ? AND quotation_id = ?`,
//             [item.listq_number, quotationId]
//           );
//       });

//       try {
//         await Promise.all([
//           ...insertPromises,
//           ...updatePromises,
//           ...deletePromises,
//         ]);
//         res
//           .status(200)
//           .json({ msg: "แก้ไขใบเสนอราคาและรายการสินค้าเรียบร้อยแล้ว" });
//       } catch (err) {
//         console.log(err);
//         res
//           .status(500)
//           .json({ msg: "เกิดข้อผิดพลาดในการปรับปรุงรายการสินค้า" });
//       }
//     }
//   );
// });

// เหลือการ auth ก่อนการ delete
router.delete("/quotation/delete/:id", (req, res) => {
  const sql = `
      UPDATE quotation 
      SET 
        quotation_del = ?
      WHERE quotation_id = ?;
    `;
  const id = req.params.id;
  const values = ["1", id];
  db.execute(sql, values, (err, result) => {
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
