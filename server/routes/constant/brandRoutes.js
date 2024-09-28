const express = require("express");
const router = express.Router();
const { db } = require("../../database");
const { getNextID } = require("../../utils/generateId");
router.get("/brand", function (req, res) {
  let fetch = "select brand_id,brand_name from brand";
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
  fetch += " Where brand_del ='0' ";
  if (search) {
    fetch += "and brand_name LIKE ? ";
    fetchValue.push("%" + search + "%");
  }
  fetch += " limit ?, ?";
  fetchValue.push(idx_start);
  fetchValue.push(per_page);
  db.execute(fetch, fetchValue, (err, result, field) => {
    if (!err) {
      db.query(
        "select count(brand_id) as total from brand where brand_del='0'",
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

router.post("/brand/insert", async (req, res) => {
  const [rows] = await db
    .promise()
    .query("SELECT brand_name FROM brand WHERE brand_name = ?", [
      req.body.brand_name,
    ]);

  if (rows.length === 0) {
    const sql =
      "insert into brand (brand_id,brand_name,brand_del) values (?,?,?)";
    const idnext = await getNextID("BRD", "brand");
    db.query(sql, [idnext, req.body.brand_name, "0"], (err, data) => {
      if (err) {
        res.status(500).json({ msg: err });
        return;
      }
      res.status(201).json({
        msg: "เพิ่มแบรนด์สำเร็จ",
      });
    });
  } else {
    res.status(409).json({
      msg: "มี แบรนด์ นี้อยู่ในระบบแล้ว",
    });
  }
});

router.put("/brand/edit/:id", async (req, res) => {
  const id = req.params.id;
  const [rows] = await db
    .promise()
    .query(
      "SELECT brand_name FROM brand WHERE brand_name = ? and brand_id !=?",
      [req.body.brand_name, id]
    );

  if (rows.length === 0) {
    const sql = `
    UPDATE brand 
    SET 
      brand_name = ?
    WHERE brand_id = ?;
  `;

    const values = [req.body.brand_name];

    db.query(sql, [...values, id], (err, result) => {
      if (err) {
        res.status(500).json({ msg: "Error updating brand" });
        return;
      }
      res.status(201).json({
        msg: "แก้ไขแบรนด์สำเร็จ",
      });
    });
  } else {
    res.status(409).json({
      msg: "มี แบรนด์ นี้อยู่ในระบบแล้ว",
    });
  }
});

router.get("/getbrand/:id", (req, res) => {
  const id = req.params.id;
  if (id == "all") {
    const sql = "select brand_id, brand_name from brand";
    db.query(sql, (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  } else {
    const sql = "select brand_name from brand where brand_id =?";
    db.query(sql, [id], (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  }
});

router.delete("/brand/delete/:id", (req, res) => {
  const sql = `
      UPDATE brand 
      SET 
        brand_del = ?
      WHERE brand_id = ?;
    `;
  const id = req.params.id;
  const values = ["1", id];
  db.execute(sql, values, (err, result) => {
    if (err) {
      console.error("Error delete employee:", err);
      res.status(500).json({
        msg: "Error delete brand",
      });
      return;
    }
    res.status(201).json({
      msg: "ลบแบรนด์เรียบร้อยแล้ว",
      data: result,
    });
    return;
  });
});

module.exports = router;
