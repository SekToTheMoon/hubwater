const express = require("express");
const router = express.Router();
const { db } = require("../../database");
const { getNextID } = require("../../utils/generateId");

router.get("/unit_m", function (req, res) {
  let fetch = "select unit_m_id,unit_m_name from unit_m";
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
  fetch += " Where unit_m_del ='0' ";
  if (search) {
    fetch += "and unit_m_name LIKE ? ";
    fetchValue.push("%" + search + "%");
  }
  fetch += " limit ?, ?";
  fetchValue.push(idx_start);
  fetchValue.push(per_page);
  db.execute(fetch, fetchValue, (err, result, field) => {
    if (!err) {
      db.query(
        "select count(unit_m_id) as total from unit_m where unit_m_del='0'",
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

router.post("/unit_m/insert", async (req, res) => {
  const [rows] = await db
    .promise()
    .query("SELECT unit_m_name FROM unit_m WHERE unit_m_name = ?", [
      req.body.unit_m_name,
    ]);

  if (rows.length === 0) {
    const sql =
      "insert into unit_m (unit_m_id,unit_m_name,unit_m_del) values (?,?,?)";
    const idnext = await getNextID("UNM", "unit_m");
    db.query(sql, [idnext, req.body.unit_m_name, "0"], (err, data) => {
      if (err) {
        res.status(500).json({ msg: err });
        return;
      }
      res.status(201).json({
        msg: "เพิ่มหน่วยวัดสำเร็จ",
      });
    });
  } else {
    res.status(409).json({
      msg: "มี หน่วยวัด นี้อยู่ในระบบแล้ว",
    });
  }
});

router.put("/unit_m/edit/:id", async (req, res) => {
  const id = req.params.id;
  const [rows] = await db
    .promise()
    .query(
      "SELECT unit_m_name FROM unit_m WHERE unit_m_name = ? and unit_m_id !=?",
      [req.body.unit_m_name, id]
    );

  if (rows.length === 0) {
    const sql = `
    UPDATE unit_m 
    SET 
      unit_m_name = ?
    WHERE unit_m_id = ?;
  `;

    const values = [req.body.unit_m_name];

    db.query(sql, [...values, id], (err, result) => {
      if (err) {
        res.status(500).json({ msg: "Error updating unit_m" });
        return;
      }
      res.status(201).json({
        msg: "แก้ไขหน่วยวัดสำเร็จ",
      });
    });
  } else {
    res.status(409).json({
      msg: "มี หน่วยวัด นี้อยู่ในระบบแล้ว",
    });
  }
});

router.get("/getunit_m/:id", (req, res) => {
  const id = req.params.id;
  if (id == "all") {
    const sql = "select unit_m_id, unit_m_name from unit_m";
    db.query(sql, (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  } else {
    const sql = "select unit_m_name from unit_m where unit_m_id =?";
    db.query(sql, [id], (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  }
});

router.delete("/unit_m/delete/:id", (req, res) => {
  const sql = `
      UPDATE unit_m 
      SET 
        unit_m_del = ?
      WHERE unit_m_id = ?;
    `;
  const id = req.params.id;
  const values = ["1", id];
  db.execute(sql, values, (err, result) => {
    if (err) {
      console.error("Error delete employee:", err);
      res.status(500).json({
        msg: "Error delete unit_m",
      });
      return;
    }
    res.status(201).json({
      msg: "ลบหน่วยวัดเรียบร้อยแล้ว",
      data: result,
    });
    return;
  });
});

module.exports = router;
