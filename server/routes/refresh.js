const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const { db } = require("../database");

router.get("/refresh", async (req, res) => {
  try {
    const cookies = req.cookies;

    // console.log(cookies.jwt, " cookies from refreshtoken");
    if (!cookies?.jwt) return res.sendStatus(401); // Unauthorized

    const refreshToken = cookies.jwt;

    // Clear the cookie
    res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });

    let userInToken;
    try {
      userInToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
      return res.sendStatus(403); // Forbidden, Invalid Token
    }

    // console.log(userInToken, " from refresh -userInToken");
    // Assuming you don't store refresh tokens, check if the user still exists
    const [result] = await db
      .promise()
      .query(
        "SELECT employee_id FROM log_time WHERE employee_id = ? AND logout_date IS NULL",
        [userInToken.employee_id]
      );

    if (!result || result.length === 0) {
      return res.sendStatus(403); // Forbidden, User not found or logged out
    }

    // Create new tokens
    const accessToken = jwt.sign(
      {
        employee_id: userInToken.employee_id,
        employee_img: userInToken.employee_img,
        employee_fname: userInToken.employee_fname,
        employee_lname: userInToken.employee_lname,
        posit_permission: userInToken.posit_permission,
        posit_name: userInToken.posit_name,
        login_date: userInToken.login_date,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "10s" } // Make sure this is short-lived
    );

    const newRefreshToken = jwt.sign(
      {
        employee_id: userInToken.employee_id,
        employee_img: userInToken.employee_img,
        employee_fname: userInToken.employee_fname,
        employee_lname: userInToken.employee_lname,
        posit_permission: userInToken.posit_permission,
        posit_name: userInToken.posit_name,
        login_date: userInToken.login_date,
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    // Creates Secure Cookie with refresh token
    res.cookie("jwt", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.json({
      employee_id: userInToken.employee_id,
      employee_img: userInToken.employee_img,
      employee_fname: userInToken.employee_fname,
      employee_lname: userInToken.employee_lname,
      posit_permission: userInToken.posit_permission,
      posit_name: userInToken.posit_name,
      accessToken: accessToken,
    });
  } catch (err) {
    console.error(err);
    res.sendStatus(500); // Internal Server Error
  }
});

module.exports = router;
