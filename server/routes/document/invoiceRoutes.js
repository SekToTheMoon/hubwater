const express = require("express");
const router = express.Router();
const { db, pool } = require("../../database");
const updateStatus = require("../../utils/updateStatus");
const { getTransactionID } = require("../../utils/generateId");

module.exports = (io) => {
  router.get("/invoice", function (req, res) {
    let fetch = `SELECT i.iv_id, i.iv_date, c.customer_fname,e.employee_fname,
      i.iv_total, i.iv_status ,q.quotation_id , b.bn_id ,r.rc_id
      FROM invoice i JOIN employee e ON i.employee_id = e.employee_id 
      JOIN customer c ON c.customer_id = i.customer_id 
      Left JOIN quotation_has_invoice q on i.iv_id = q.iv_id  
      Left JOIN bill_has_invoice b on i.iv_id = b.iv_id 
      Left JOIN invoice_has_receipt r on i.iv_id = r.iv_id 
      WHERE i.iv_del = '0'`;
    let fetchValue = [];
    const page = parseInt(req.query.page);
    const per_page = parseInt(req.query.per_page);
    const sort_by = req.query.sort_by;
    const sort_type = req.query.sort_type;
    const search = req.query.search;
    const idx_start = (page - 1) * per_page;

    if (search) {
      fetch += ` AND (
        i.iv_id LIKE ?
        OR c.customer_fname LIKE ?
        OR i.iv_date LIKE ?
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
          "SELECT COUNT(iv_id) AS total FROM invoice WHERE iv_del='0'",
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

  router.post("/invoice/insert", async (req, res) => {
    const sqlInsertInvoice = `insert into invoice (iv_id,iv_date,iv_status,iv_credit,iv_total,iv_del,iv_detail,iv_vat,iv_tax,employee_id,customer_id,iv_dateend) values (?,?,?,?,?,?,?,?,?,?,?,?)`;
    // const sqlSelectNext = `select LPAD(IFNULL(Max(SUBSTR(iv_id, 12, 5)),0)+1,5,'0') as next from invoice ;`;
    const sqlInertQtIv = `INSERT INTO quotation_has_invoice (iv_id, quotation_id, quotation_num ) VALUES (?,?,?)`;
    const sqlInertBnIv = `INSERT INTO bill_has_invoice (iv_id, bn_id ) VALUES (?,?)`;

    try {
      const connection = await pool.promise().getConnection();
      await connection.beginTransaction();

      try {
        // const [next] = await connection.query(sqlSelectNext);

        // const idnext =
        //   "IV" +
        //   moment(req.body.invoice_date).format("YYYYMMDD") +
        //   "-" +
        //   next[0].next;
        const idnext = await getTransactionID(
          "IV",
          "invoice",
          req.body.invoice_date
        );
        await connection.query(sqlInsertInvoice, [
          idnext,
          req.body.invoice_date,
          req.body.invoice_status,
          req.body.invoice_credit,
          req.body.invoice_total,
          "0",
          req.body.invoice_detail,
          req.body.invoice_vat,
          req.body.invoice_tax,
          req.body.employee_id,
          req.body.customer_id,
          req.body.invoice_dateend,
        ]);
        if (req.body.items && req.body.items.length > 0) {
          const itemPromises = req.body.items.map((item) =>
            connection.query(
              `insert into listi (listi_number,listi_price,listi_amount,listi_total,product_id,lot_number,iv_id) values (?,?,?,?,?,?,?)`,
              [
                item.listi_number,
                item.product_price,
                item.listi_amount,
                item.listi_total,
                item.product_id,
                item.lot_number,
                idnext,
              ]
            )
          );
          await Promise.all(itemPromises);
        }
        //ต้องแก้ ใบที่ ของใบเสนอราคาด้วย ตอนนี้กำหนดเป็น 1 ไปก่อน
        if (req.body.quotation_id) {
          await connection.query(sqlInertQtIv, [
            idnext,
            req.body.quotation_id,
            1,
          ]);
          updateStatus(io, req.body.quotation_id, "ดำเนินการแล้ว", res);
        }
        if (req.body.bn_id) {
          await connection.query(sqlInertBnIv, [idnext, req.body.bn_id]);
          updateStatus(io, req.body.bn_id, "ดำเนินการแล้ว", res);
        }

        await connection.commit();
        res.status(201).json({ msg: "เพิ่มใบแล้ว" });
      } catch (err) {
        console.error(err);
        await connection.rollback();
        res.status(500).json({ msg: "เกิดข้อผิดพลาดในการเพิ่มรายการสินค้า" });
      } finally {
        connection.release();
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล" });
    }
  });

  router.get("/getinvoice/:id", function (req, res) {
    const ivId = req.params.id;
    const sqlInvoice = `SELECT iv_date, iv_total, iv_credit, iv_detail, iv_vat, iv_tax, employee_id, customer_id ,iv_dateend ,iv_status FROM invoice WHERE iv_id = ?;`;

    db.query(sqlInvoice, [ivId], (err, ivDetail) => {
      if (err) {
        console.log(err);
        return res.json(err);
      }

      const sqlListq = `SELECT listi_number, listi_price, listi_amount, listi_total, product_id, lot_number FROM listi WHERE iv_id = ?;`;
      db.query(sqlListq, [ivId], (err, listiDetail) => {
        if (err) {
          console.log(err);
          return res.json(err);
        }

        console.log(listiDetail);
        const productIds = listiDetail.map((item) => item.product_id);

        // ตรวจสอบว่าอาร์เรย์ productIds ไม่ว่างเปล่า
        if (productIds.length === 0) {
          return res.json({
            ivDetail: ivDetail,
            listiDetail: listiDetail,
            productDetail: [],
            employee_name: "",
            message: "ไม่พบสินค้าสำหรับรหัสบิลที่กำหนด",
          });
        }

        const sqlProduct = `SELECT product_id, product_name, product_price, product_img, unit.unit_name FROM product JOIN unit ON product.unit_id = unit.unit_id WHERE product_id IN (?);`;
        db.query(sqlProduct, [productIds], (err, productDetail) => {
          if (err) {
            console.log(err);
            return res.json(err);
          }

          const sqlEmployee_name =
            'SELECT CONCAT(employee_fname, " ", employee_lname) AS employee_name FROM employee WHERE employee_id = ?;';
          db.query(
            sqlEmployee_name,
            [ivDetail[0].employee_id],
            (err, employee_nameResult) => {
              if (err) {
                console.log(err);
                return res.json(err);
              }

              const employee_name = employee_nameResult[0]
                ? employee_nameResult[0].employee_name
                : "";
              return res.json({
                ivDetail: ivDetail,
                listiDetail: listiDetail,
                productDetail: productDetail,
                employee_name: employee_name,
              });
            }
          );
        });
      });
    });
  });

  router.put("/invoice/status", function (req, res) {
    const { status, iv_id } = req.body;
    const sql = "update invoice set iv_status = ? where iv_id = ?";
    db.query(sql, [status, iv_id]);
  });
  router.put("/invoice/edit/:id", async (req, res) => {
    const ivId = req.params.id;

    const updateInvoiceSql = `UPDATE invoice 
                                SET iv_date = ?, iv_credit = ?, iv_total = ?, iv_detail = ?, 
                                    iv_vat = ?, iv_tax = ?, employee_id = ?, customer_id = ?, iv_dateend = ?
                                WHERE iv_id = ?`;

    db.query(
      updateInvoiceSql,
      [
        req.body.iv_date,
        req.body.iv_credit,
        req.body.iv_total,
        req.body.iv_detail,
        req.body.iv_vat,
        req.body.iv_tax,
        req.body.employee_id,
        req.body.customer_id,
        req.body.iv_dateend,
        ivId,
      ],
      async (err) => {
        if (err) {
          console.log(err);
          return res
            .status(500)
            .json({ msg: "Update ข้อมูลใบแจ้งหนี้ผิดพลาด" });
        }

        const sqlListb = `SELECT listi_number, product_id
                          FROM listi WHERE iv_id = ?`;

        const [existingItems] = await db.promise().query(sqlListb, [ivId]);

        const existingItemMap = new Map();
        existingItems.forEach((item) => {
          const key = `${item.product_id}-${item.listi_number}`;
          existingItemMap.set(key, item);
        });

        const newItemMap = new Map();
        req.body.items.forEach((item) => {
          const key = `${item.product_id}-${item.listi_number}`;
          newItemMap.set(key, item);
        });

        const toInsert = [];
        const toUpdate = [];
        const toDelete = [];

        newItemMap.forEach((item, key) => {
          if (existingItemMap.has(key)) {
            toUpdate.push(item);
            existingItemMap.delete(key);
          } else {
            toInsert.push(item);
          }
        });

        existingItemMap.forEach((item, key) => {
          toDelete.push(item);
        });

        const insertPromises = toInsert.map((item, index) => {
          return db.promise().query(
            `INSERT INTO listi (listi_number, listi_price, listi_amount, listi_total, product_id, lot_number, iv_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              item.listi_number,
              item.product_price,
              item.listi_amount,
              item.listi_total,
              item.product_id,
              item.lot_number,
              ivId,
            ]
          );
        });

        const updatePromises = toUpdate.map((item) => {
          return db.promise().query(
            `UPDATE listi SET listi_price = ?, listi_amount = ?, listi_total = ?, lot_number = ? 
             WHERE  listi_number = ? AND iv_id = ?`,
            [
              item.product_price,
              item.listi_amount,
              item.listi_total,
              item.lot_number,
              item.listi_number,
              ivId,
            ]
          );
        });

        const deletePromises = toDelete.map((item) => {
          return db
            .promise()
            .query(`DELETE FROM listi WHERE listi_number = ? AND iv_id = ?`, [
              item.listi_number,
              ivId,
            ]);
        });

        try {
          await Promise.all([
            ...insertPromises,
            ...updatePromises,
            ...deletePromises,
          ]);
          res.status(200).json({
            msg: "แก้ไขใบแจ้งหนี้เสนอราคาและรายการสินค้าเรียบร้อยแล้ว",
          });
        } catch (err) {
          console.log(err);
          res
            .status(500)
            .json({ msg: "เกิดข้อผิดพลาดในการปรับปรุงรายการสินค้า" });
        }
      }
    );
  });

  // เหลือการ auth ก่อนการ delete
  router.delete("/invoice/delete/:id", (req, res) => {
    const sql = `
      UPDATE invoice 
      SET 
        iv_del = ?
      WHERE iv_id = ?;
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

  return router;
};
