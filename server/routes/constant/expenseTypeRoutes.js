const express = require("express");
const router = express.Router();
const { db } = require("../../database");
const { getNextID } = require("../../utils/generateId");

router.get("/expensetype", function (req, res) {
  let fetch = "select expensetype_id,expensetype_name from expensetype";
  let fetchValue = [];
  const page = parseInt(req.query.page);
  const per_page = parseInt(req.query.per_page);
  const sort_by = req.query.sort_by;
  const sort_type = req.query.sort_type;
  const search = req.query.search;
  const idx_start = (page - 1) * per_page;

  if (sort_by && sort_type) {
    fetch += " ORDER BY " + sort_by + " " + sort_type;
  }
  fetch += " Where expensetype_del ='0' ";
  if (search) {
    fetch += "and expensetype_name LIKE ? ";
    fetchValue.push("%" + search + "%");
  }
  fetch += " limit ?, ?";
  fetchValue.push(idx_start);
  fetchValue.push(per_page);
  db.execute(fetch, fetchValue, (err, result, field) => {
    if (!err) {
      db.query(
        "select count(expensetype_id) as total from expensetype where expensetype_del='0'",
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

router.post("/expensetype/insert", async (req, res) => {
  const [rows] = await db
    .promise()
    .query(
      "SELECT expensetype_name FROM expensetype WHERE expensetype_name = ?",
      [req.body.expensetype_name]
    );

  if (rows.length === 0) {
    const sql =
      "insert into expensetype (expensetype_id,expensetype_name,expensetype_del) values (?,?,?)";
    const idnext = await getNextID("EPT", "expensetype");
    db.query(sql, [idnext, req.body.expensetype_name, "0"], (err, data) => {
      if (err) {
        res.status(500).json({ msg: err });
        return;
      }
      res.status(201).json({
        msg: "เพิ่มประเภทค่าใช้จ่ายสำเร็จ",
      });
    });
  } else {
    res.status(409).json({
      msg: "มี ประเภทค่าใช้จ่าย นี้อยู่ในระบบแล้ว",
    });
  }
});

router.put("/expensetype/edit/:id", async (req, res) => {
  const id = req.params.id;
  const [rows] = await db
    .promise()
    .query(
      "SELECT expensetype_name FROM expensetype WHERE expensetype_name = ? and expensetype_id !=?",
      [req.body.expensetype_name, id]
    );

  if (rows.length === 0) {
    const sql = `
    UPDATE expensetype 
    SET 
      expensetype_name = ?
    WHERE expensetype_id = ?;
  `;

    const values = [req.body.expensetype_name];

    db.query(sql, [...values, id], (err, result) => {
      if (err) {
        res.status(500).json({ msg: "Error updating expensetype" });
        return;
      }
      res.status(201).json({
        msg: "แก้ไขประเภทค่าใช้จ่ายสำเร็จ",
      });
    });
  } else {
    res.status(409).json({
      msg: "มี ประเภทค่าใช้จ่าย นี้อยู่ในระบบแล้ว",
    });
  }
});

router.get("/getexpensetype/:id", (req, res) => {
  const id = req.params.id;
  if (id == "all") {
    const sql = "select expensetype_id, expensetype_name from expensetype";
    db.query(sql, (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  } else {
    const sql =
      "select expensetype_name from expensetype where expensetype_id =?";
    db.query(sql, [id], (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  }
});

router.delete("/expensetype/delete/:id", (req, res) => {
  const sql = `
      UPDATE expensetype 
      SET 
        expensetype_del = ?
      WHERE expensetype_id = ?;
    `;
  const id = req.params.id;
  const values = ["1", id];
  db.execute(sql, values, (err, result) => {
    if (err) {
      console.error("Error delete employee:", err);
      res.status(500).json({
        msg: "Error delete expensetype",
      });
      return;
    }
    res.status(201).json({
      msg: "ลบประเภทค่าใช้จ่ายเรียบร้อยแล้ว",
      data: result,
    });
    return;
  });
});
module.exports = router;
