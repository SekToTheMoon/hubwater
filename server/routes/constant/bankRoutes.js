const express = require("express");
const router = express.Router();
const { db } = require("../../database");
const { getNextID } = require("../../utils/generateId");

router.get("/bank", function (req, res) {
  let fetch =
    "select bank_id,bank_name,bank_num,bank_name,bank_owner from bank";
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
  fetch += " Where bank_del ='0'";
  if (search) {
    fetch += " and bank_name LIKE ? ";
    fetchValue.push("%" + search + "%");
  }
  fetch += " LIMIT ?, ?";
  fetchValue.push(idx_start);
  fetchValue.push(per_page);
  db.query(fetch, fetchValue, (err, result, field) => {
    if (!err) {
      db.query(
        "select count(bank_id) as total from bank where bank_del='0'",
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
router.post("/bank/insert", async (req, res) => {
  const [rows] = await db
    .promise()
    .query("SELECT bank_id FROM bank WHERE bank_name = ? and bank_owner = ?", [
      req.body.bank_name,
      req.body.bank_owner,
    ]);

  if (rows.length === 0) {
    const sql =
      "INSERT INTO bank (bank_id, bank_name, bank_branch, bank_owner, bank_type, bank_num, bank_del) VALUES (?, ?, ?, ?, ?, ?, ?)";
    const idnext = await getNextID("BAK", "bank");
    db.query(
      sql,
      [
        idnext,
        req.body.bank_name,
        req.body.bank_branch,
        req.body.bank_owner,
        req.body.bank_type,
        req.body.bank_num,
        "0",
      ],
      (err, data) => {
        if (err) {
          res.status(500).json({ msg: err });
          return;
        }
        res.status(201).json({
          msg: "เพิ่มบัญชีธนาคารสำเร็จ",
        });
      }
    );
  } else {
    res.status(409).json({
      msg: "มี บัญชีธนาคาร นี้อยู่ในระบบแล้ว",
    });
  }
});

router.put("/bank/edit/:id", async (req, res) => {
  const [rows] = await db
    .promise()
    .query(
      "SELECT bank_id FROM bank WHERE bank_name = ? and bank_owner = ? and bank_id != ?",
      [req.body.bank_name, req.body.bank_owner, req.params.id]
    );

  if (rows.length === 0) {
    const sql = `
    UPDATE bank 
    SET 
      bank_name = ?,bank_branch = ?,bank_owner = ?,bank_type = ?,bank_num = ?
    WHERE bank_id = ?;
  `;

    const values = [
      req.body.bank_name,
      req.body.bank_branch,
      req.body.bank_owner,
      req.body.bank_type,
      req.body.bank_num,
    ];
    const id = req.params.id;
    db.query(sql, [...values, id], (err, result) => {
      if (err) {
        res.status(500).json({ msg: "Error updating bank" });
        return;
      }
      res.status(201).json({
        msg: "แก้ไขบัญชีธนาคารสำเร็จ",
      });
    });
  } else {
    res.status(409).json({
      msg: "มี บัญชีธนาคาร นี้อยู่ในระบบแล้ว",
    });
  }
});

router.get("/getbank/:id", (req, res) => {
  const id = req.params.id;
  if (id == "all") {
    const sql = "select bank_id, bank_name ,bank_type , bank_num from bank";
    db.query(sql, (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  } else {
    const sql =
      "select bank_name,bank_branch,bank_owner,bank_type,bank_num from bank where bank_id =?";
    db.query(sql, [id], (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  }
});

router.delete("/bank/delete/:id", (req, res) => {
  const sql = `
      UPDATE bank 
      SET 
        bank_del = ?
      WHERE bank_id = ?;
    `;
  const id = req.params.id;
  const values = ["1", id];
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error delete bank:", err);
      res.status(500).json({
        msg: "Error delete bank",
      });
      return;
    }
    res.status(201).json({
      msg: "ลบบัญชีธนาคารเรียบร้อยแล้ว",
      data: result,
    });
    return;
  });
});
module.exports = router;
