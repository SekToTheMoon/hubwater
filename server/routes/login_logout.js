const express = require("express");
const router = express.Router();
const { db } = require("../database");
const bcrypt = require("bcrypt");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateToken");

//ใช้จัดเก็บโทเค้น
let refreshTokens = [];

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ message: "กรุณากรอก username และ password" });

  db.query(
    "SELECT employee_username, employee_password FROM employee WHERE employee_username = ?",
    [username],
    (err, result) => {
      if (err) {
        return res.status(500).json({ msg: "ไม่พบผู้ใช้บัญนี้ในระบบ" });
      }
      if (result.length > 0) {
        const hashedPassword = result[0].employee_password;

        bcrypt.compare(password, hashedPassword, (err, isMatch) => {
          if (isMatch) {
            // ทำการ query ข้อมูล employee ที่ล็อกอินเพื่อสร้าง token
            db.query(
              "SELECT employee_id, employee_img,employee_fname, employee_lname, posit_permission, posit_name FROM employee JOIN posit on employee.posit_id = posit.posit_id WHERE employee_username = ?",
              [username],
              (err, emp) => {
                if (err) {
                  return res.status(500).json({ msg: err });
                }
                const token = generateAccessToken(emp[0]);
                const refreshToken = generateRefreshToken(emp[0]);

                db.query(
                  "INSERT INTO log_time (employee_id, login_date) VALUES (?, ?)",
                  [emp[0].employee_id, new Date()],
                  (err) =>
                    err && console.log(err + "จากการ insert ข้อมูล login ")
                );
                // refreshTokens.push(refreshToken);
                // console.log(refreshTokens);
                // console.log(refreshTokens); เอาไว้ดูว่ามี refreshtoken กี่ตัวแล้ว

                // Creates Secure Cookie with refresh token
                res.cookie("jwt", refreshToken, {
                  httpOnly: true,
                  secure: true,
                  sameSite: "None",
                  maxAge: 24 * 60 * 60 * 1000,
                }); //secure: true,
                res.status(200).json({
                  msg: "เข้าสู่ระบบสำเร็จ!",
                  employee_id: emp[0].employee_id,
                  employee_fname: emp[0].employee_fname,
                  employee_lname: emp[0].employee_lname,
                  posit_permission: emp[0].posit_permission,
                  posit_name: emp[0].posit_name,
                  employee_img: emp[0].employee_img,
                  token,
                  refreshToken,
                });
              }
            );
          } else {
            return res.status(401).json({
              msg: "รหัสผ่าน ไม่ถูกต้อง",
            });
          }
        });
      } else {
        return res.status(401).json({ msg: "ไม่มี username นี้อยู่ในระบบ !" });
      }
    }
  );
});

module.exports = router;
