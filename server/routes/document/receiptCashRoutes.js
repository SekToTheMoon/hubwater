const express = require("express");
const router = express.Router();
const { db, pool } = require("../../database");
const { getTransactionID } = require("../../utils/generateId");

router.get("/receiptcash", function (req, res) {
  let fetch =
    "SELECT i.rf_id, i.rf_date, c.customer_fname,e.employee_fname, i.rf_total, i.rf_status FROM receiptcash i JOIN employee e ON i.employee_id = e.employee_id LEFT OUTER JOIN customer c ON c.customer_id = i.customer_id WHERE i.rf_del = '0'";
  let fetchValue = [];
  const page = parseInt(req.query.page);
  const per_page = parseInt(req.query.per_page);
  const sort_by = req.query.sort_by;
  const sort_type = req.query.sort_type;
  const search = req.query.search;
  const idx_start = (page - 1) * per_page;

  if (search) {
    fetch += ` AND (
        i.rf_id LIKE ?
        OR c.customer_fname LIKE ?
        OR i.rf_date LIKE ?
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
        "SELECT COUNT(rf_id) AS total FROM receiptcash WHERE rf_del='0'",
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

router.post("/receiptcash/insert", async (req, res) => {
  const sqlInsertInvoice = `insert into receiptcash (rf_id,rf_date,rf_status,rf_total,rf_del,rf_detail,rf_vat,rf_tax,employee_id,customer_id) values (?,?,?,?,?,?,?,?,?,?)`;
  const sqlSelectNext = `select LPAD(IFNULL(Max(SUBSTR(rf_id, 12, 5)),0)+1,5,'0') as next from receiptcash ;`;

  try {
    const connection = await pool.promise().getConnection();
    await connection.beginTransaction();

    try {
      // const [next] = await connection.query(sqlSelectNext);

      // const idnext =
      //   "RF" + moment(req.body.rf_date).format("YYYYMMDD") + "-" + next[0].next;
      const idnext = await getTransactionID(
        "RF",
        "receiptcash",
        req.body.rf_date
      );
      await connection.query(sqlInsertInvoice, [
        idnext,
        req.body.rf_date,
        "รอเก็บเงิน",
        req.body.rf_total,
        "0",
        req.body.rf_detail,
        req.body.rf_vat,
        req.body.rf_tax,
        req.body.employee_id,
        req.body.customer_id ? req.body.customer_id : null,
      ]);
      if (req.body.items && req.body.items.length > 0) {
        const itemPromises = req.body.items.map((item, index) =>
          connection.query(
            `insert into listrf (listrf_number,listrf_price,listrf_amount,listrf_total,product_id,lot_number,rf_id) values (?,?,?,?,?,?,?)`,
            [
              index + 1,
              item.product_price,
              item.listrf_amount,
              item.listrf_total,
              item.product_id,
              item.lot_number,
              idnext,
            ]
          )
        );
        await Promise.all(itemPromises);
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

router.get("/getreceiptcash/:id", function (req, res) {
  const rfId = req.params.id;
  const sqlReceiptCash = `SELECT rf_date, rf_total, rf_detail, rf_vat, rf_tax, employee_id, customer_id  FROM receiptcash WHERE rf_id = ?;`;
  const sqlListq = `SELECT listrf_number, listrf_price, listrf_amount, listrf_total, product_id, lot_number FROM listrf WHERE rf_id = ?;`;
  db.query(sqlReceiptCash, [rfId], (err, rfDetail) => {
    if (err) {
      console.log(err);
      return res.json(err);
    }

    db.query(sqlListq, [rfId], (err, listrf_Detail) => {
      if (err) {
        console.log(err);
        return res.json(err);
      }
      const productIds = listrf_Detail.map((item) => item.product_id);

      // ตรวจสอบว่าอาร์เรย์ productIds ไม่ว่างเปล่า
      if (productIds.length === 0) {
        return res.json({
          rfDetail: rfDetail,
          listrf_Detail: listrf_Detail,
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
          [rfDetail[0].employee_id],
          (err, employee_nameResult) => {
            if (err) {
              console.log(err);
              return res.json(err);
            }

            const employee_name = employee_nameResult[0]
              ? employee_nameResult[0].employee_name
              : "";
            return res.json({
              rfDetail: rfDetail,
              listrf_Detail: listrf_Detail,
              productDetail: productDetail,
              employee_name: employee_name,
            });
          }
        );
      });
    });
  });
});

router.put("/receiptcash/edit/:id", async (req, res) => {
  const rfId = req.params.id;

  const updateInvoiceSql = `UPDATE receiptcash 
                                SET rf_date = ?, rf_total = ?, rf_detail = ?, 
                                    rf_vat = ?, rf_tax = ?,  customer_id = ?
                                WHERE rf_id = ?`;

  db.query(
    updateInvoiceSql,
    [
      req.body.rf_date,
      req.body.rf_total,
      req.body.rf_detail,
      req.body.rf_vat,
      req.body.rf_tax,
      req.body.customer_id ? req.body.customer_id : null,
      rfId,
    ],
    async (err) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ msg: "Update ข้อมูลผิดพลาด" });
      }

      const sqlListrf = `SELECT listrf_number, product_id
                          FROM listrf WHERE rf_id = ?`;

      const [existingItems] = await db.promise().query(sqlListrf, [rfId]);

      const existingItemMap = new Map();
      existingItems.forEach((item) => {
        const key = `${item.product_id}-${item.listrf_number}`;
        existingItemMap.set(key, item);
      });

      const newItemMap = new Map();
      req.body.items.forEach((item) => {
        const key = `${item.product_id}-${item.listrf_number}`;
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
          `INSERT INTO listrf (listrf_number, listrf_price, listrf_amount, listrf_total, product_id, lot_number, rf_id)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            item.listrf_number,
            item.product_price,
            item.listrf_amount,
            item.listrf_total,
            item.product_id,
            item.lot_number,
            rfId,
          ]
        );
      });

      const updatePromises = toUpdate.map((item) => {
        return db.promise().query(
          `UPDATE listrf SET listrf_price = ?, listrf_amount = ?, listrf_total = ?, lot_number = ? 
             WHERE  listrf_number = ? AND rf_id = ?`,
          [
            item.product_price,
            item.listrf_amount,
            item.listrf_total,
            item.lot_number,
            item.listrf_number,
            rfId,
          ]
        );
      });

      const deletePromises = toDelete.map((item) => {
        return db
          .promise()
          .query(`DELETE FROM listrf WHERE listrf_number = ? AND rf_id = ?`, [
            item.listrf_number,
            rfId,
          ]);
      });

      try {
        await Promise.all([
          ...insertPromises,
          ...updatePromises,
          ...deletePromises,
        ]);
        res.status(200).json({ msg: "แก้ไขใบและรายการสินค้าเรียบร้อยแล้ว" });
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
router.delete("/receiptcash/delete/:id", (req, res) => {
  const sql = `
      UPDATE receiptcash 
      SET 
        rf_del = ?
      WHERE rf_id = ?;
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
