const express = require("express");
const router = express.Router();
const { db } = require("../database");

router.get("/getprovince", (req, res) => {
  const sql = "select code,name from provinces";
  db.query(sql, (err, data) => {
    if (err) {
      return res.json(err);
    }
    return res.json(data);
  });
});

router.get("/getdistrict/:id", (req, res) => {
  const sql = "select code,name from district where province_code = ?;";
  db.query(sql, req.params.id, (err, data) => {
    if (err) {
      return res.json(err);
    }
    return res.json(data);
  });
});

router.get("/getsubdistrict/:id", (req, res) => {
  const sql =
    "select code,name,zip_code from subdistrict where district_code = ?;";
  db.query(sql, req.params.id, (err, data) => {
    if (err) {
      return res.json(err);
    }
    return res.json(data);
  });
});

router.get("/getcompany", function (req, res) {
  let sql = `SELECT company_name, company_address, company_phone, 
    company_email, company_taxpayer ,
    subdistrict_code,s.zip_code , p.code as province, d.code as district 
    FROM company c
    LEFT JOIN subdistrict s ON c.subdistrict_code = s.code
    LEFT JOIN district d ON s.district_code = d.code
    LEFT JOIN provinces p ON d.province_code = p.code;`;
  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json(err); // ส่งกลับ error พร้อมสถานะ 500
    } else {
      res.json(results[0]); // ส่งผลลัพธ์การ query กลับไปยัง client
    }
  });
});

module.exports = router;
