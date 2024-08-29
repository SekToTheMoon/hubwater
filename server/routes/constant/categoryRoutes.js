const express = require("express");
const router = express.Router();
const { db } = require("../../database");

router.get("/type", function (req, res) {
  let fetch = "select type_id,type_name,type_category from type";
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
  fetch += " Where type_del ='0' ";
  if (search) {
    fetch += "and type_name LIKE ? ";
    fetchValue.push("%" + search + "%");
  }
  fetch += " limit ?, ?";
  fetchValue.push(idx_start);
  fetchValue.push(per_page);
  db.execute(fetch, fetchValue, (err, result, field) => {
    if (!err) {
      db.query(
        "select count(type_id) as total from type where type_del='0'",
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

router.post("/type/insert", async (req, res) => {
  const [rows] = await db
    .promise()
    .query("SELECT type_id FROM type WHERE type_name = ? and type_category=?", [
      req.body.type_name,
      req.body.type_category,
    ]);

  if (rows.length === 0) {
    const sql =
      "insert into type (type_id,type_name,type_category,type_del) values (?,?,?,?)";
    const idnext = await getNextID("TYP", "type");
    db.query(
      sql,
      [idnext, req.body.type_name, req.body.type_category, "0"],
      (err, data) => {
        if (err) {
          res.status(500).json({ msg: err });
          return;
        }
        res.status(201).json({
          msg: "เพิ่มประเภทสำเร็จ",
        });
      }
    );
  } else {
    res.status(409).json({
      msg: "มี ประเภท นี้อยู่ในระบบแล้ว",
    });
  }
});

router.get("/gettype/:id", (req, res) => {
  const id = req.params.id;
  if (id == "all") {
    const sql = "select type_id, type_name ,type_category from type";
    db.query(sql, (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  } else {
    const sql = "select type_name ,type_category from type where type_id =?";
    db.query(sql, [id], (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  }
});

router.put("/type/edit/:id", async (req, res) => {
  const [rows] = await db
    .promise()
    .query(
      "SELECT type_id FROM type WHERE type_name = ? and type_category =?",
      [req.body.type_name, req.body.type_category]
    );

  if (rows.length === 0) {
    const sql = `
    UPDATE type 
    SET 
      type_name = ? ,
      type_category = ?
    WHERE type_id = ?;
  `;

    const values = [req.body.type_name, req.body.type_category];
    const id = req.params.id;
    db.query(sql, [...values, id], (err, result) => {
      if (err) {
        res.status(500).json({ msg: "Error updating type" });
        return;
      }
      res.status(201).json({
        msg: "แก้ไขประเภทสำเร็จ",
      });
    });
  } else {
    res.status(409).json({
      msg: "มี ประเภท นี้อยู่ในระบบแล้ว",
    });
  }
});

router.delete("/type/delete/:id", (req, res) => {
  const sql = `
      UPDATE type 
      SET 
        type_del = ?
      WHERE type_id = ?;
    `;
  const id = req.params.id;
  const values = ["1", id];
  db.execute(sql, values, (err, result) => {
    if (err) {
      console.error("Error delete type:", err);
      res.status(500).json({
        msg: "Error delete type",
      });
      return;
    }
    res.status(201).json({
      msg: "ลบประเภทเรียบร้อยแล้ว",
      data: result,
    });
    return;
  });
});
module.exports = router;
