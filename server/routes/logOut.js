const express = require("express");
const router = express.Router();
const { db } = require("../database");

const { generateAccessToken } = require("../utils/generateToken");

router.post("/logout", (req, res) => {
  // console.log(req.cookies);

  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  const accessToken = cookies.jwt;
  console.log(accessToken + " from cookies");
  console.log(req.body.refreshToken + " from varifyJWT");

  db.query(
    "UPDATE log_time SET logout_date = ? WHERE employee_id = ? and login_date = ?;",
    [new Date(), req.user.employee_id, req.user.login_date]
  );

  // res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  res.sendStatus(204);

  //   console.log("this is logout " + req.body.refreshToken);

  //   refreshTokens = refreshTokens.filter(
  //     (token) => token !== req.body.refreshToken
  //   );
  //   res.json({ message: "Logout successful", clearLocalStorage: true });
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
