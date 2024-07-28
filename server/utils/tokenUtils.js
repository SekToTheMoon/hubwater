const jwt = require("jsonwebtoken");
const SECRET_KEY = "your-secret-key";
let refreshTokens = [];

function generateAccessToken(username) {
  return jwt.sign({ username }, SECRET_KEY, { expiresIn: "15m" });
}

function generateRefreshToken(username) {
  return jwt.sign({ username }, SECRET_KEY, { expiresIn: "7d" });
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  refreshTokens,
};
