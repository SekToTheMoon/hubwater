const jwt = require("jsonwebtoken");
require("dotenv").config(); // เดี๋ยวลองลบว่าจะใช้ได้ฤป่าว
function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "5s" });
}

function generateRefreshToken(user) {
  return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "1d" });
}

module.exports = { generateAccessToken, generateRefreshToken };
