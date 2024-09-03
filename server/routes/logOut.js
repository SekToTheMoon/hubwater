const express = require("express");
const router = express.Router();
const { db } = require("../database");
const jwt = require("jsonwebtoken");
const { generateAccessToken } = require("../utils/generateToken");

router.get("/logout", (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  try {
    const refreshToken = cookies.jwt;
    const decode = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    console.log(decode, " from logOut -decode");

    const logOutTime = require("moment")().format("YYYY-MM-DD HH:mm:ss");
    db.query(
      "UPDATE log_time SET logout_date = ? WHERE employee_id = ? and login_date = ?;",
      [logOutTime, decode.employee_id, decode.login_date]
    );

    res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
    res.sendStatus(204);
  } catch (err) {
    console.log(err);
  }
});

router.post("/token", (req, res) => {
  const refreshToken = req.body.refreshToken;
  if (refreshToken === null) return res.status(401).send("ไม่มีการส่งมา");
  if (!refreshTokens.includes(refreshToken))
    return res.status(401).send("ไม่มี refreshtoken นี้ในระบบ");
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    const token = generateAccessToken(user.username);
    console.log("/token is work and this is new accesstoken " + token);
    res.json({ token: token });
  });
});

module.exports = router;
