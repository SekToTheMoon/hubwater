// database.js
require("dotenv").config();
const mysql = require("mysql2");

const urlDB = `mysql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;
// ตั้งค่าการเชื่อมต่อฐานข้อมูล MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "hubwater",
  timezone: "Z",
});
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "hubwater",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
// const db = mysql.createConnection(
//   `mysql://root:PnsPXYlqnxHnjEBlJBbpLbrsVGlXvLgO@autorack.proxy.rlwy.net:16215/hubwater`
// );

// เชื่อมต่อกับฐานข้อมูล
db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    return;
  }
  console.log("Connected to the database");
});

module.exports = { db, pool };
// module.exports = { db };
