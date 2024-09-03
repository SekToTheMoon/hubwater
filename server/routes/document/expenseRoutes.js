const express = require("express");
const router = express.Router();
const { db, pool } = require("../../database");
const fs = require("fs");
const path = require("path");
const { getTransactionID } = require("../../utils/generateId");
const { uploadExpense } = require("../../middleware/diskStorage");

router.get("/out", function (req, res) {
  let fetch =
    "SELECT o.out_id, o.out_date, e.employee_fname, o.out_total, o.out_status FROM expense o JOIN employee e ON o.employee_id = e.employee_id WHERE o.out_del = '0'";
  let fetchValue = [];
  const page = parseInt(req.query.page);
  const per_page = parseInt(req.query.per_page);
  const sort_by = req.query.sort_by;
  const sort_type = req.query.sort_type;
  const search = req.query.search;
  const idx_start = (page - 1) * per_page;

  if (search) {
    fetch += ` AND (
        o.out_id LIKE ?
        OR c.customer_fname LIKE ?
        OR o.out_date LIKE ?
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
        "SELECT COUNT(out_id) AS total FROM expense WHERE out_del='0'",
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

router.post("/out/insert", uploadExpense.array("img"), async (req, res) => {
  const items = JSON.parse(req.body.items);
  const sql = `INSERT INTO expense (Out_id, Out_date, Out_status, Out_total, Out_del, Out_detail, employee_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const sqlInsertImg = "INSERT INTO outimg (out_id, outimg) VALUES (?, ?)";
  const imageFiles = req.files;

  const connection = await pool.promise().getConnection();
  await connection.beginTransaction();

  try {
    const idNext = await getTransactionID("OT", "expense", req.body.out_date);
    await connection.query(sql, [
      idNext,
      req.body.out_date,
      "รอจ่ายเงิน",
      req.body.out_total,
      "0",
      req.body.out_detail,
      req.body.employee_id,
    ]);

    if (items && items.length > 0) {
      let index = 1;
      for (const item of items) {
        await connection.query(
          `INSERT INTO listout (listo_number,listo_name, listo_price, listo_amount, listo_total, Out_id, expensetype_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            index, // ใช้ index
            item.listo_name,
            item.listo_price,
            item.listo_amount,
            item.listo_total,
            idNext,
            item.expensetype_id,
          ]
        );
        index++;
      }
    }

    if (imageFiles && imageFiles.length > 0) {
      for (const file of imageFiles) {
        await connection.query(sqlInsertImg, [idNext, file.filename]);
      }
    }

    await connection.commit();
    res.status(201).json({ msg: "เพิ่มใบแล้ว" });
  } catch (err) {
    await connection.rollback();
    console.log(err);
    res.status(500).json({ msg: "เกิดข้อผิดพลาดในการเพิ่มข้อมูล" });
  } finally {
    connection.release();
  }
});

router.post("/out/edit/:id", uploadExpense.array("img"), async (req, res) => {
  const items = JSON.parse(req.body.items);
  const oldImages = JSON.parse(req.body.oldImage);
  const outId = req.params.id;
  const sqlUpdateOut = `UPDATE expense SET Out_date = ?, Out_status = ?, Out_total = ?, Out_detail = ? WHERE Out_id = ?`;
  const sqlDeleteListOut = `DELETE FROM listout WHERE Out_id = ?`;
  const sqlInsertListOut = `INSERT INTO listout (listo_number, listo_name, listo_price, listo_amount, listo_total, Out_id, expensetype_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const sqlDeleteOutImg = `DELETE FROM outimg WHERE out_id = ?`;
  const sqlInsertOutImg = "INSERT INTO outimg (out_id, outimg) VALUES (?, ?)";
  const imageFiles = req.files;

  const connection = await pool.promise().getConnection();

  try {
    await connection.beginTransaction();

    // อัพเดตข้อมูลเอกสาร
    await connection.query(sqlUpdateOut, [
      req.body.out_date,
      "รอจ่ายเงิน",
      req.body.out_total,
      req.body.out_detail,
      outId,
    ]);

    // ลบรายการค่าใช้จ่ายเก่า
    await connection.query(sqlDeleteListOut, [outId]);

    // เพิ่มรายการค่าใช้จ่ายใหม่
    if (items && items.length > 0) {
      let index = 1;
      for (const item of items) {
        await connection.query(sqlInsertListOut, [
          index, // ใช้ index
          item.listo_name,
          item.listo_price,
          item.listo_amount,
          item.listo_total,
          outId,
          item.expensetype_id,
        ]);
        index++;
      }
    }

    // ลบรูปภาพเก่า
    await connection.query(sqlDeleteOutImg, [outId]);

    // เพิ่มรูปภาพใหม่
    if (imageFiles && imageFiles.length > 0) {
      for (const file of imageFiles) {
        await connection.query(sqlInsertOutImg, [outId, file.filename]);
      }
      // ลบรูปภาพเก่าออกจากโฟลเดอร์
      oldImages.forEach((img) => {
        const filePath = path.join(
          __dirname,
          "..",
          "..",
          "img",
          "expense",
          img.outimg
        );
        console.log(filePath);
        fs.unlink(filePath, (err) => {
          if (err) {
            console.log(`Failed to delete image: ${img.outimg}`, err);
          }
        });
      });
    }

    await connection.commit();
    res.status(200).json({ msg: "แก้ไขข้อมูลสำเร็จ" });
  } catch (err) {
    await connection.rollback();
    console.log(err);
    res.status(500).json({ msg: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" });
  } finally {
    connection.release();
  }
});

router.put("/out/money", function (req, res) {
  const { out_id, out_date, out_pay, bank_id } = req.body;
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
      res.json(err);
    } else {
      res.json("บันทึกการรับเงินเรียบร้อย");
    }
  });
});

router.get("/getout/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [outData] = await db.promise().query(
      `SELECT out_date,out_total,out_detail,expense.employee_id,
        CONCAT(employee_fname," ",employee_lname) as employee_fullname 
        FROM expense 
        JOIN employee e on expense.employee_id = e.employee_id 
        WHERE Out_id = ?`,
      [id]
    );

    const [listData] = await db
      .promise()
      .query(
        `SELECT listo_number,listo_name,listo_price,listo_amount,listo_total,expensetype_name,listout.expensetype_id FROM listout join expensetype on listout.expensetype_id = expensetype.expensetype_id WHERE Out_id = ?`,
        [id]
      );
    const [imagesData] = await db
      .promise()
      .query(`SELECT outimg FROM outimg WHERE out_id = ?`, [id]);

    res.json({
      outData: outData[0],
      listData,
      imagesData,
    });
  } catch (error) {
    res.status(500).json({ msg: "Error fetching data", error });
  }
});

router.delete("/out/delete/:id", (req, res) => {
  const sql = `
      UPDATE expense 
      SET 
        out_del = ?
      WHERE out_id = ?;
    `;
  const id = req.params.id;
  const values = ["1", id];
  console.log(id);
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
