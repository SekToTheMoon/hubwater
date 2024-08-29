const express = require("express");
const router = express.Router();
const { db, pool } = require("../../database");
const updateStatus = require("../../utils/updateStatus");
const { getTransactionID } = require("../../utils/generateId");

module.exports = (io) => {
  router.get("/bill", function (req, res) {
    let fetch = `SELECT b.bn_id, b.bn_date, c.customer_fname,e.employee_fname, b.bn_total, b.bn_status,b.bn_type , q.quotation_id , i.iv_id
      FROM bill b JOIN employee e ON b.employee_id = e.employee_id 
      JOIN customer c ON c.customer_id = b.customer_id 
      Left JOIN quotation_has_bill q on b.bn_id = q.bn_id  
      Left JOIN bill_has_invoice i on b.bn_id = i.bn_id 
      WHERE b.bn_del = '0'`;
    let fetchValue = [];
    const page = parseInt(req.query.page);
    const per_page = parseInt(req.query.per_page);
    const sort_by = req.query.sort_by;
    const sort_type = req.query.sort_type;
    const search = req.query.search;
    const idx_start = (page - 1) * per_page;

    if (search) {
      fetch += ` AND (
        b.bn_id LIKE ?
        OR c.customer_fname LIKE ?
        OR b.bn_date LIKE ?
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
          "SELECT COUNT(bn_id) AS total FROM bill WHERE bn_del='0'",
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

  router.post("/bill/insert", async (req, res) => {
    const sqlInsertBill = `INSERT INTO bill (bn_id, bn_date, bn_status, bn_credit, bn_total, bn_del, bn_detail, bn_vat, bn_tax, employee_id, customer_id, bn_type, bn_dateend) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    const sqlInertQtBn = `INSERT INTO quotation_has_bill (bn_id, quotation_id, quotation_num ) VALUES (?,?,?)`;

    try {
      const connection = await pool.promise().getConnection();
      await connection.beginTransaction();

      try {
        const idnext = await getTransactionID("BN", "bill", req.body.bill_date);

        await connection.query(sqlInsertBill, [
          idnext,
          req.body.bill_date,
          req.body.bill_status,
          req.body.bill_credit,
          req.body.bill_total,
          "0",
          req.body.bill_detail,
          req.body.bill_vat,
          req.body.bill_tax,
          req.body.employee_id,
          req.body.customer_id,
          "เดี่ยว",
          req.body.bill_dateend,
        ]);

        if (req.body.items && req.body.items.length > 0) {
          const itemPromises = req.body.items.map((item) =>
            connection.query(
              `INSERT INTO listb (listb_number, listb_price, listb_amount, listb_total, product_id, lot_number, bn_id) VALUES (?,?,?,?,?,?,?)`,
              [
                item.listb_number,
                item.product_price,
                item.listb_amount,
                item.listb_total,
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
          await connection.query(sqlInertQtBn, [
            idnext,
            req.body.quotation_id,
            1,
          ]);
          updateStatus(io, req.body.quotation_id, "ดำเนินการแล้ว", res);
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

  router.get("/getbill/:id", function (req, res) {
    const bnId = req.params.id;
    const sqlBill = `SELECT bn_date, bn_total, bn_credit, bn_detail, bn_vat, bn_tax, employee_id, customer_id ,bn_type,bn_dateend ,bn_status FROM bill WHERE bn_id = ?;`;

    db.query(sqlBill, [bnId], (err, bnDetail) => {
      if (err) {
        console.log(err);
        return res.json(err);
      }

      const sqlListq = `SELECT listb_number, listb_price, listb_amount, listb_total, product_id, lot_number FROM listb WHERE bn_id = ?;`;
      db.query(sqlListq, [bnId], (err, listbDetail) => {
        if (err) {
          console.log(err);
          return res.json(err);
        }

        console.log(listbDetail);
        const productIds = listbDetail.map((item) => item.product_id);

        // ตรวจสอบว่าอาร์เรย์ productIds ไม่ว่างเปล่า
        if (productIds.length === 0) {
          return res.json({
            bnDetail: bnDetail,
            listbDetail: listbDetail,
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
            [bnDetail[0].employee_id],
            (err, employee_nameResult) => {
              if (err) {
                console.log(err);
                return res.json(err);
              }

              const employee_name = employee_nameResult[0]
                ? employee_nameResult[0].employee_name
                : "";
              return res.json({
                bnDetail: bnDetail,
                listbDetail: listbDetail,
                productDetail: productDetail,
                employee_name: employee_name,
              });
            }
          );
        });
      });
    });
  });

  router.put("/bill/status", function (req, res) {
    const { status, bn_id } = req.body;
    const sql = "update bill set bn_status = ? where bn_id = ?";
    db.query(sql, [status, bn_id]);
  });
  router.put("/bill/edit/:id", async (req, res) => {
    const bnId = req.params.id;

    const updateBillSql = `UPDATE bill 
                                SET bn_date = ?, bn_credit = ?, bn_total = ?, bn_detail = ?, 
                                    bn_vat = ?, bn_tax = ?, employee_id = ?, customer_id = ?,bn_type =?, bn_dateend = ?
                                WHERE bn_id = ?`;

    db.query(
      updateBillSql,
      [
        req.body.bn_date,
        req.body.bn_credit,
        req.body.bn_total,
        req.body.bn_detail,
        req.body.bn_vat,
        req.body.bn_tax,
        req.body.employee_id,
        req.body.customer_id,
        "เดี่ยว",
        req.body.bn_dateend,
        bnId,
      ],
      async (err) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ msg: "Update ข้อมูลใบผิดพลาด" });
        }

        const sqlListb = `SELECT listb_number, product_id
                          FROM listb WHERE bn_id = ?`;

        const [existingItems] = await db.promise().query(sqlListb, [bnId]);

        const existingItemMap = new Map();
        existingItems.forEach((item) => {
          const key = `${item.product_id}-${item.listb_number}`;
          existingItemMap.set(key, item);
        });

        const newItemMap = new Map();
        req.body.items.forEach((item) => {
          const key = `${item.product_id}-${item.listb_number}`;
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
        console.log(existingItemMap);

        const insertPromises = toInsert.map((item, index) => {
          return db.promise().query(
            `INSERT INTO listb (listb_number, listb_price, listb_amount, listb_total, product_id, lot_number, bn_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              item.listb_number,
              item.product_price,
              item.listb_amount,
              item.listb_total,
              item.product_id,
              item.lot_number,
              bnId,
            ]
          );
        });

        const updatePromises = toUpdate.map((item) => {
          console.log(item);
          return db.promise().query(
            `UPDATE listb SET listb_price = ?, listb_amount = ?, listb_total = ?, lot_number = ? 
             WHERE  listb_number = ? AND bn_id = ?`,
            [
              item.product_price,
              item.listb_amount,
              item.listb_total,
              item.lot_number,
              item.listb_number,
              bnId,
            ]
          );
        });

        const deletePromises = toDelete.map((item) => {
          return db
            .promise()
            .query(`DELETE FROM listb WHERE listb_number = ? AND bn_id = ?`, [
              item.listb_number,
              bnId,
            ]);
        });

        try {
          await Promise.all([
            ...insertPromises,
            ...updatePromises,
            ...deletePromises,
          ]);
          res
            .status(200)
            .json({ msg: "แก้ไขใบเสนอราคาและรายการสินค้าเรียบร้อยแล้ว" });
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
  router.delete("/bill/delete/:id", (req, res) => {
    const sql = `
      UPDATE bill 
      SET 
        bn_del = ?
      WHERE bn_id = ?;
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
