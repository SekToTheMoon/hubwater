const express = require("express");
const router = express.Router();
const { db } = require("../../database");
const { getNextID } = require("../../utils/generateId");

router.get("/department", function (req, res) {
  let fetch = "select dep_id,dep_name from dep";
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
  fetch += " Where dep_del ='0' ";
  if (search) {
    fetch += "and dep_name LIKE ? ";
    fetchValue.push("%" + search + "%");
  }
  fetch += " limit ?, ?";
  fetchValue.push(idx_start);
  fetchValue.push(per_page);
  db.query(fetch, fetchValue, (err, result, field) => {
    if (!err) {
      db.query(
        "select count(dep_id) as total from dep where dep_del='0'",
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

router.post("/department/insert", async (req, res) => {
  const [rows] = await db
    .promise()
    .query("SELECT dep_name FROM dep WHERE dep_name = ?", [req.body.dep_name]);

  if (rows.length === 0) {
    const sql = "insert into dep (dep_id,dep_name,dep_del) values (?,?,?)";
    const idnext = await getNextID("DEP", "dep");
    db.query(sql, [idnext, req.body.dep_name, "0"], (err, data) => {
      if (err) {
        res.status(500).json({ msg: err });
        return;
      }
      res.status(201).json({
        msg: "เพิ่มแผนกสำเร็จ",
      });
    });
  } else {
    res.status(409).json({
      msg: "มี แผนก นี้อยู่ในระบบแล้ว",
    });
  }
});

router.put("/department/edit/:id", async (req, res) => {
  const id = req.params.id;
  const [rows] = await db
    .promise()
    .query("SELECT dep_name FROM dep WHERE dep_name = ? and dep_id !=?", [
      req.body.dep_name,
      id,
    ]);

  if (rows.length === 0) {
    const sql = `
    UPDATE dep 
    SET 
      dep_name = ?
    WHERE dep_id = ?;
  `;

    const values = [req.body.dep_name];

    db.query(sql, [...values, id], (err, result) => {
      if (err) {
        res.status(500).json({ msg: "Error updating department" });
        return;
      }
      res.status(201).json({
        msg: "แก้ไขแผนกสำเร็จ",
      });
    });
  } else {
    res.status(409).json({
      msg: "มี แผนก นี้อยู่ในระบบแล้ว",
    });
  }
});

router.get("/getdep/:id", (req, res) => {
  const id = req.params.id;
  if (id == "all") {
    const sql = "select dep_id, dep_name from dep";
    db.query(sql, (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  } else {
    const sql = "select dep_name from dep where dep_id =?";
    db.query(sql, [id], (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  }
});

router.delete("/department/delete/:id", (req, res) => {
  const sql = `
      UPDATE dep 
      SET 
        dep_del = ?
      WHERE dep_id = ?;
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
      msg: "ลบแผนกเรียบร้อยแล้ว",
      data: result,
    });
    return;
  });
});

module.exports = router;
