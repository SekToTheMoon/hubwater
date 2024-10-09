const express = require("express");
const router = express.Router();
const { db } = require("../../database");
const { getNextID } = require("../../utils/generateId");

router.get("/unit", function (req, res) {
  let fetch = "select unit_id,unit_name from unit";
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
  fetch += " Where unit_del ='0' ";
  if (search) {
    fetch += "and unit_name LIKE ? ";
    fetchValue.push("%" + search + "%");
  }
  fetch += " limit ?, ?";
  fetchValue.push(idx_start);
  fetchValue.push(per_page);
  db.query(fetch, fetchValue, (err, result, field) => {
    if (!err) {
      db.query(
        "select count(unit_id) as total from unit where unit_del='0'",
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

router.post("/unit/insert", async (req, res) => {
  const [rows] = await db
    .promise()
    .query("SELECT unit_name FROM unit WHERE unit_name = ?", [
      req.body.unit_name,
    ]);

  if (rows.length === 0) {
    const sql = "insert into unit (unit_id,unit_name,unit_del) values (?,?,?)";
    const idnext = await getNextID("UNI", "unit");
    db.query(sql, [idnext, req.body.unit_name, "0"], (err, data) => {
      if (err) {
        res.status(500).json({ msg: err });
        return;
      }
      res.status(201).json({
        msg: "เพิ่มหน่วยนับสำเร็จ",
      });
    });
  } else {
    res.status(409).json({
      msg: "มี หน่วยนับ นี้อยู่ในระบบแล้ว",
    });
  }
});

router.put("/unit/edit/:id", async (req, res) => {
  const id = req.params.id;
  const [rows] = await db
    .promise()
    .query("SELECT unit_name FROM unit WHERE unit_name = ? and unit_id !=?", [
      req.body.unit_name,
      id,
    ]);

  if (rows.length === 0) {
    const sql = `
    UPDATE unit 
    SET 
      unit_name = ?
    WHERE unit_id = ?;
  `;

    const values = [req.body.unit_name];

    db.query(sql, [...values, id], (err, result) => {
      if (err) {
        res.status(500).json({ msg: "Error updating unit" });
        return;
      }
      res.status(201).json({
        msg: "แก้ไขหน่วยนับสำเร็จ",
      });
    });
  } else {
    res.status(409).json({
      msg: "มี หน่วยนับ นี้อยู่ในระบบแล้ว",
    });
  }
});

router.get("/getunit/:id", (req, res) => {
  const id = req.params.id;
  if (id == "all") {
    const sql = "select unit_id, unit_name from unit";
    db.query(sql, (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  } else {
    const sql = "select unit_name from unit where unit_id =?";
    db.query(sql, [id], (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  }
});

router.delete("/unit/delete/:id", (req, res) => {
  const sql = `
      UPDATE unit 
      SET 
        unit_del = ?
      WHERE unit_id = ?;
    `;
  const id = req.params.id;
  const values = ["1", id];
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error delete employee:", err);
      res.status(500).json({
        msg: "Error delete unit",
      });
      return;
    }
    res.status(201).json({
      msg: "ลบหน่วยนับเรียบร้อยแล้ว",
      data: result,
    });
    return;
  });
});

module.exports = router;
