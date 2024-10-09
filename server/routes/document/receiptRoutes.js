const express = require("express");
const router = express.Router();
const { db } = require("../../database");
const { getTransactionID } = require("../../utils/generateId");
const updateStatus = require("../../utils/updateStatus");

module.exports = (io) => {
  //ทำเสร็จแล้วอย่าลืมดูว่า rc_type ต้องใช้ฤป่าว
  router.get("/receipt", function (req, res) {
    let fetch = `SELECT b.rc_id, b.rc_date, b.rc_vat, c.customer_fname,e.employee_fname, b.rc_total, b.rc_status,b.rc_type, b.rc_tax ,b.rc_detail ,
      i.iv_id
      FROM receipt b JOIN employee e ON b.employee_id = e.employee_id 
      JOIN customer c ON c.customer_id = b.customer_id 
      Left JOIN invoice_has_receipt i on b.rc_id = i.rc_id
      WHERE b.rc_del = '0'`;
    let fetchValue = [];
    const page = parseInt(req.query.page);
    const per_page = parseInt(req.query.per_page);
    const sort_by = req.query.sort_by;
    const sort_type = req.query.sort_type;
    const search = req.query.search;
    const idx_start = (page - 1) * per_page;

    if (search) {
      fetch += ` AND (
        b.rc_id LIKE ?
        OR c.customer_fname LIKE ?
        OR b.rc_date LIKE ?
      )`;
      fetchValue = Array(3).fill(`${search}%`);
    }

    if (sort_by && sort_type) {
      fetch += " ORDER BY " + sort_by + " " + sort_type;
    }

    fetch += " order by rc_id DESC  LIMIT ?, ?";
    fetchValue.push(idx_start);
    fetchValue.push(per_page);

    db.query(fetch, fetchValue, (err, result, field) => {
      if (!err) {
        db.query(
          "SELECT COUNT(rc_id) AS total FROM receipt WHERE rc_del='0'",
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

  router.post("/receipt/insert", async (req, res) => {
    const sql = `insert into receipt (rc_id,rc_date,rc_status,rc_total,rc_del,rc_detail,rc_vat,rc_tax,employee_id,customer_id,rc_type,disc_cash,disc_percent) values (?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    const sqlInertIvRc =
      "insert into invoice_has_receipt (rc_id,iv_id) values (?,?)";

    const idnext = await getTransactionID(
      "RC",
      "receipt",
      req.body.receipt_date
    );

    db.query(
      sql,
      [
        idnext,
        req.body.receipt_date,
        "รอเก็บเงิน",
        req.body.receipt_total,
        "0",
        req.body.receipt_detail,
        req.body.receipt_vat,
        req.body.receipt_tax,
        req.body.employee_id,
        req.body.customer_id,
        "เดี่ยว", //ความจริงต้องเอามาจากข้อมูลใบที่สร้าง
        req.body.disc_cash,
        req.body.disc_percent,
      ],
      (err) => {
        if (err) {
          console.log(err);
          return res
            .status(500)
            .json({ msg: "insert ข้อมูลใบวางบิลผิด ไม่เกี่ยวกับรายการ" });
        }
        if (req.body.items && req.body.items.length > 0) {
          let success = true; // ตั้งค่าเริ่มต้นเป็น true
          req.body.items.forEach((item, index) => {
            db.query(
              `insert into listr (listr_number,listr_price,listr_amount,listr_total,product_id,lot_number,rc_id) values (?,?,?,?,?,?,?)`,
              [
                item.listi_number,
                item.product_price,
                item.listi_amount,
                item.listi_total,
                item.product_id,
                item.lot_number,
                idnext,
              ],
              (err) => {
                if (err) {
                  console.log(err);
                  success = false; // ถ้าเกิดข้อผิดพลาดในการเพิ่มรายการสินค้า เปลี่ยนเป็น false
                }
                // ให้ส่งการตอบกลับไปยังไคลเอนต์เมื่อวนลูปเสร็จสิ้น
                if (index === req.body.items.length - 1) {
                  if (success) {
                    if (req.body.iv_id) {
                      db.query(sqlInertIvRc, [idnext, req.body.iv_id]);
                      updateStatus(io, req.body.iv_id, "ดำเนินการแล้ว", res);
                    }
                    res.status(201).json({
                      msg: "เพิ่มใบแล้ว",
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
            msg: "เพิ่มใบแล้ว",
          });
        }
      }
    );
  });

  router.get("/getreceipt/:id", function (req, res) {
    const rcId = req.params.id;
    const sqlReceipt = `SELECT rc_date, rc_total,  rc_detail, rc_vat, rc_tax, employee_id, customer_id ,rc_type,disc_cash,disc_percent FROM receipt WHERE rc_id = ?;`;

    db.query(sqlReceipt, [rcId], (err, rcDetail) => {
      if (err) {
        console.log(err);
        return res.json(err);
      }

      const sqlListq = `SELECT listr_number, listr_price, listr_amount, listr_total, product_id, lot_number FROM listr WHERE rc_id = ?;`;
      db.query(sqlListq, [rcId], (err, listrDetail) => {
        if (err) {
          console.log(err);
          return res.json(err);
        }
        const productIds = listrDetail.map((item) => item.product_id);

        // ตรวจสอบว่าอาร์เรย์ productIds ไม่ว่างเปล่า
        if (productIds.length === 0) {
          return res.json({
            rcDetail: rcDetail,
            listrDetail: listrDetail,
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
            [rcDetail[0].employee_id],
            (err, employee_nameResult) => {
              if (err) {
                console.log(err);
                return res.json(err);
              }
              const employee_name = employee_nameResult[0]
                ? employee_nameResult[0].employee_name
                : "";
              return res.json({
                rcDetail: rcDetail,
                listrDetail: listrDetail,
                productDetail: productDetail,
                employee_name: employee_name,
              });
            }
          );
        });
      });
    });
  });

  router.put("/receipt/status", function (req, res) {
    const { status, rc_id } = req.body;
    const sql = "update receipt set rc_status = ? where rc_id = ?";
    db.query(sql, [status, rc_id]);
  });

  router.put("/receipt/money", async function (req, res) {
    const { rc_id, rc_payday, rc_detail, rc_pay, bank_id } = req.body;
    let sql = "update receipt set  rc_payday =? ,rc_detail =? ,rc_pay =? ";
    let values = [rc_payday, rc_detail, rc_pay];
    if (bank_id) {
      sql += ", bank_id =? ";
      values.push(bank_id);
    }
    sql += "where rc_id = ?";
    values.push(rc_id);
    db.query(sql, values, (err) => {
      if (err) {
        console.error(err);
        return res.json(err);
      }
    });
    const [rcDetail] = await db
      .promise()
      .query(
        "select e.employee_id , e.employee_commit ,rc_total from receipt join employee e on receipt.employee_id = e.employee_id where rc_id = ?",
        rc_id
      );
    db.query(
      `insert into commission (employee_id, cm_date, cm_per, cm_total, document) values (?,?,?,?,?)`,
      [
        req.user.employee_id,
        rc_payday,
        rcDetail[0].employee_commit,
        rcDetail[0].rc_total * (rcDetail[0].employee_commit / 100),
        rc_id,
      ],
      (err) => {
        if (err) {
          console.error(err);
          res.json(err);
        } else {
          res.json("บันทึกการรับเงินเรียบร้อย");
        }
      }
    );
  });

  router.delete("/receipt/delete/:id", (req, res) => {
    const sql = `
      UPDATE receipt 
      SET 
        rc_del = ?
      WHERE rc_id = ?;
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

  return router;
};
