const express = require("express");
const router = express.Router();
const { db } = require("../../database");

router.get("/position", function (req, res) {
  let fetch =
    "select posit_id,posit_name,dep_name from posit JOIN dep ON posit.dep_id=dep.dep_id";
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
  fetch += " Where posit_del ='0' ";
  if (search) {
    fetch += "and posit_name LIKE ? ";
    fetchValue.push("%" + search + "%");
  }
  fetch += " limit ?, ?";
  fetchValue.push(idx_start);
  fetchValue.push(per_page);
  db.execute(fetch, fetchValue, (err, result, field) => {
    if (!err) {
      db.query(
        "select count(posit_id) as total from posit where posit_del='0'",
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

router.post("/position/insert", async (req, res) => {
  const [rows] = await db
    .promise()
    .query("SELECT posit_id FROM posit WHERE posit_name = ? and dep_id =?", [
      req.body.posit_name,
      req.body.dep_id,
    ]);
  if (rows.length === 0) {
    const sql =
      "insert into posit (posit_id,posit_name,posit_permission,dep_id,posit_del) values (?,?,?,?,?)";
    const idnext = await getNextID("POS", "posit");
    db.query(
      sql,
      [idnext, req.body.posit_name, req.body.permission, req.body.dep_id, "0"],
      (err, data) => {
        if (err) {
          res.status(500).json({ msg: "insert ผิด" });
          return;
        }
        res.status(201).json({
          msg: "เพิ่มตำแหน่งสำเร็จ",
        });
      }
    );
  } else {
    res.status(409).json({
      msg: "มี ตำแหน่ง นี้อยู่ในระบบแล้ว",
    });
  }
});

router.get("/getposit/:id", (req, res) => {
  const id = req.params.id;
  const sql =
    "select posit_name ,posit_permission,dep_id from posit where posit_id =?";
  db.query(sql, [id], (err, data) => {
    if (err) {
      return res.json(err);
    }
    return res.json(data);
  });
});

router.put("/position/edit/:id", async (req, res) => {
  const [rows] = await db
    .promise()
    .query("SELECT posit_name FROM posit WHERE posit_name = ? and dep_id =?", [
      req.body.posit_name,
      req.body.dep_id,
    ]);

  if (rows.length === 0) {
    const sql = `
      UPDATE posit 
      SET 
        posit_name = ?,
        posit_permission = ?,
        dep_id = ?
      WHERE posit_id = ?;
    `;

    const values = [req.body.posit_name, req.body.permission, req.body.dep_id];
    const id = req.params.id;
    db.execute(sql, [...values, id], (err, result) => {
      if (err) {
        res.status(500).json({ msg: "Error updating department" });
        return;
      }
      res.status(201).json({
        msg: "แก้ไขตำแหน่งสำเร็จ",
        data: result,
      });
      return;
    });
  } else {
    res.status(409).json({
      msg: "มี ตำแหน่ง นี้อยู่ในระบบแล้ว",
    });
  }
});

router.delete("/position/delete/:id", (req, res) => {
  const sql = `
      UPDATE posit 
      SET 
        posit_del = ?
      WHERE posit_id = ?;
    `;
  const id = req.params.id;
  const values = ["1", id];
  db.execute(sql, values, (err, result) => {
    if (err) {
      res.status(500).json({
        msg: "Error delete position" + err,
      });
      return;
    }
    res.status(201).json({
      msg: "ลบตำแหน่งเรียบร้อยแล้ว",
      data: result,
    });
    return;
  });
});
module.exports = router;
