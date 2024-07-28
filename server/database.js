// database.js

const mysql = require("mysql2");

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

// เชื่อมต่อกับฐานข้อมูล
db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
    return;
  }
  console.log("Connected to the database");
});

module.exports = { db, pool };
