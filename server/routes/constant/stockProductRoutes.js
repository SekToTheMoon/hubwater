const express = require("express");
const router = express.Router();
const { db, pool } = require("../../database");
const moment = require("moment");

router.get("/stock", function (req, res) {
  let fetch =
    "SELECT lot.lot_number, lot.lot_price, lot.lot_amount, lot.lot_total, lot.lot_date, lot_exp.lot_exp_date FROM lot LEFT JOIN lot_exp ON lot.lot_number = lot_exp.lot_number and lot.product_id = lot_exp.product_id where lot.product_id=?";
  const id = req.query.id;
  let fetchValue = [id];

  const page = parseInt(req.query.page);
  const per_page = parseInt(req.query.per_page);
  const sort_by = req.query.sort_by;
  const sort_type = req.query.sort_type;
  const search = req.query.search;
  const idx_start = (page - 1) * per_page;

  if (sort_by && sort_type) {
    fetch += " ORDER BY " + sort_by + " " + sort_type;
  }
  if (search) {
    fetch += "and product_id LIKE ? ";
    fetchValue.push("%" + search + "%");
  }
  fetch += " limit ?, ?";
  fetchValue.push(idx_start);
  fetchValue.push(per_page);
  db.query(fetch, fetchValue, (err, result) => {
    if (!err) {
      db.query(
        "select count(product_id) as total from lot where product_id = ?",
        id,
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

router.get("/selectstock/:id", function (req, res) {
  const id = req.params.id;
  let fetch =
    "SELECT lot_number, lot_amount ,lot_price ,lot_date FROM lot WHERE product_id= ? and lot_amount > 0";
  let fetchValue = [id];
  db.query(fetch, fetchValue, (err, result, field) => {
    if (!err) {
      res.json(result);
    } else {
      res.json({ msg: "query น่าจะผิด" });
    }
  });
});

router.post("/stock/insert", async (req, res) => {
  const next = await db
    .promise()
    .query(
      `select LPAD(IFNULL(Max(SUBSTR(lot_number, 13, 4)),0)+1,4,'0') as next from lot where product_id =?;`,
      [req.body.product_id]
    );
  const idnext =
    "LOT" + moment(Date.now()).format("YYYYMMDD") + "-" + next[0][0].next;
  console.log(idnext, " ไอดีของ lot ");
  const sql = `insert into lot (product_id,lot_number,lot_price,lot_amount,lot_total,lot_date) values (?,?,?,?,?,?)`;
  db.query(
    sql,
    [
      req.body.product_id,
      idnext,
      req.body.lot_price,
      req.body.lot_amount,
      req.body.lot_amount,
      req.body.lot_date,
    ],
    (err) => {
      if (err) {
        res.status(500).json({ msg: "insert ผิด" + err });
        console.log(err);
        return;
      }
    }
  );
  if (req.body.lot_exp_date) {
    db.query(
      `insert into lot_exp (product_id,lot_number,lot_exp_date) values (?,?,?)`,
      [req.body.product_id, idnext, req.body.lot_exp_date],
      (err) => {
        if (err) {
          res.status(500).json({ msg: "insert ผิด" + err });
          console.log(err);
          return;
        }
      }
    );
  }
  db.query(
    `UPDATE product
       SET product_amount = product_amount + ?
       WHERE product_id = ?;`,
    [req.body.lot_amount, req.body.product_id],
    (err) => {
      if (err) {
        res.status(404).json({
          msg: "insert ผิด" + err,
        });
      } else {
        res.status(201).json({
          msg: "เพิ่มสินค้าสำเร็จ",
        });
      }
    }
  );
});

router.put("/stock/edit/:id", async (req, res) => {
  const product_id = req.params.id;

  if (req.body.lot_amountNew) {
    req.body.lot_amount += req.body.lot_amountNew;
    console.log(req.body.lot_amount);
  }

  const updateLot = `
      UPDATE lot
      SET lot_price = ?, lot_amount = ?, lot_total = ?, lot_date = ?
      WHERE product_id = ? AND lot_number = ?;
    `;

  try {
    await db
      .promise()
      .query(updateLot, [
        req.body.lot_price,
        req.body.lot_amount,
        req.body.lot_total,
        req.body.lot_date,
        product_id,
        req.body.lot_number,
      ]);

    if (req.body.lot_exp_date) {
      const checkLotExp = `
            SELECT 1 FROM lot_exp
            WHERE product_id = ? AND lot_number = ?;
          `;
      const [rows] = await db
        .promise()
        .query(checkLotExp, [product_id, req.body.lot_number]);

      if (rows.length > 0) {
        const updateLotExp = `
              UPDATE lot_exp
              SET lot_exp_date = ?
              WHERE product_id = ? AND lot_number = ?;
            `;
        await db
          .promise()
          .query(updateLotExp, [
            req.body.lot_exp_date,
            product_id,
            req.body.lot_number,
          ]);
      } else {
        const insertLotExp = `
              INSERT INTO lot_exp (product_id, lot_number, lot_exp_date)
              VALUES (?, ?, ?);
            `;
        await db
          .promise()
          .query(insertLotExp, [
            product_id,
            req.body.lot_number,
            req.body.lot_exp_date,
          ]);
      }
    }

    if (req.body.lot_amountNew) {
      const updateProductAmount = `
          UPDATE product
          SET product_amount = product_amount + ?
          WHERE product_id = ?;
        `;
      await db
        .promise()
        .query(updateProductAmount, [req.body.lot_amountNew, product_id]);
    }

    res.status(201).json({
      msg: "เพิ่มสินค้าสำเร็จ",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      msg: "insert ผิด " + err,
    });
  }
});

router.put("/stockcut", async (req, res) => {
  let connection;

  try {
    connection = await pool.promise().getConnection();
    await connection.beginTransaction();
    const sqlListInvoice = `SELECT listi_amount, product_id, lot_number FROM listi WHERE iv_id = ?;`;
    const sqlLotCut = `UPDATE lot SET lot_amount = lot_amount - ? WHERE lot_number =? AND product_id =?`;
    const sqlProductCut = `UPDATE product SET product_amount = product_amount - ? WHERE product_id =?`;
    let id_or_item;
    if (req.body.id) {
      const [result] = await connection.query(sqlListInvoice, [req.body.id]);
      id_or_item = result;
    } else {
      id_or_item = req.body.item;
    }
    for (const item of id_or_item) {
      await connection.query(sqlLotCut, [
        item.listi_amount,
        item.lot_number,
        item.product_id,
      ]);
      await connection.query(sqlProductCut, [
        item.listi_amount,
        item.product_id,
      ]);
    }

    await connection.commit();
    res.json({ msg: "ตัดสต๊อกสินค้าสำเร็จ" });
  } catch (err) {
    console.error(err);
    if (connection) {
      await connection.rollback();
    }
    res.status(500).json({ msg: "เกิดข้อผิดพลาดในการตัดสต๊อกสินค้า" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

router.put("/returestock", async (req, res) => {
  let connection;
  const { id } = req.body;
  try {
    connection = await pool.promise().getConnection();
    await connection.beginTransaction();
    const sqlListInvoice = `SELECT listi_amount, product_id, lot_number FROM listi WHERE iv_id = ?;`;
    const sqlLotCut = `UPDATE lot SET lot_amount = lot_amount + ? WHERE lot_number =? AND product_id =?`;
    const sqlProductCut = `UPDATE product SET product_amount = product_amount + ? WHERE product_id =?`;
    const [listInvoice] = await connection.query(sqlListInvoice, [id]);
    for (const item of listInvoice) {
      await connection.query(sqlLotCut, [
        item.listi_amount,
        item.lot_number,
        item.product_id,
      ]);
      await connection.query(sqlProductCut, [
        item.listi_amount,
        item.product_id,
      ]);
    }

    await connection.commit();
    res.json({ msg: "คืนสต๊อกสินค้าสำเร็จ" });
  } catch (err) {
    console.error(err);
    if (connection) {
      await connection.rollback();
    }
    res.status(500).json({ msg: "เกิดข้อผิดพลาดในการคืนสต๊อกสินค้า" });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

module.exports = router;
