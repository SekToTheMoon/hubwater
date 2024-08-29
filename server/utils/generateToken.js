const jwt = require("jsonwebtoken");
require("dotenv").config(); // เดี๋ยวลองลบว่าจะใช้ได้ฤป่าว
function generateAccessToken(user) {
  return jwt.sign(
    user,
    process.env.ACCESS_TOKEN_SECRET
    // { expiresIn: "59s" }
  );
}

function generateRefreshToken(user) {
  user.login_date = new Date();
  return jwt.sign(
    user,
    process.env.REFRESH_TOKEN_SECRET
    // { expiresIn: "59s" }
  );
}

module.exports = { generateAccessToken, generateRefreshToken };
