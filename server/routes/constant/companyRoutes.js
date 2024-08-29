const express = require("express");
const router = express.Router();
const { db } = require("../../database");
const { uploadCompany } = require("../../middleware/diskStorage");

router.put(
  "/company/edit",
  uploadCompany.fields([{ name: "logo" }, { name: "signature" }]),
  async (req, res) => {
    const {
      company_name,
      company_address,
      company_phone,
      company_email,
      company_taxpayer,
      subdistrict_code,
    } = req.body;

    let sql = `
      UPDATE company 
      SET 
        company_name = ?,
        company_address = ?,
        company_phone = ?,
        company_email = ?,
        company_taxpayer = ?,
        subdistrict_code = ?
      WHERE id = 1;
    `;

    db.query(
      sql,
      [
        company_name,
        company_address,
        company_phone,
        company_email,
        company_taxpayer,
        subdistrict_code,
      ],
      (err, results) => {
        if (err) {
          console.error(err);
          res.status(500).json(err); // ส่งกลับ error พร้อมสถานะ 500
        } else {
          res.json("บันทึกค่าคงที่บริษัทเสร็จสิ้น"); // ส่งผลลัพธ์การ query กลับไปยัง client
        }
      }
    );
  }
);
module.exports = router;
