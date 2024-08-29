// updateStatus.js
const { db } = require("../database");

const updateStatus = (io, id, status, res) => {
  let tableName;
  let idField;

  if (status === "สร้างใบวางบิล" || status === "สร้างใบแจ้งหนี้")
    status = "ดำเนินการแล้ว";

  if (id.startsWith("QT")) {
    tableName = "quotation";
    idField = "quotation";
  } else if (id.startsWith("BN")) {
    tableName = "bill";
    idField = "bn";
  } else if (id.startsWith("IV")) {
    tableName = "invoice";
    idField = "iv";
  } else if (id.startsWith("RC")) {
    tableName = "receipt";
    idField = "rc";
  } else if (id.startsWith("OT")) {
    tableName = "expense";
    idField = "out";
  } else if (id.startsWith("RF")) {
    tableName = "receiptcash";
    idField = "rf";
  } else {
    return res.status(400).send("Invalid ID prefix.");
  }

  const sql = `UPDATE ${tableName} SET ${idField}_status = ? WHERE ${idField}_id = ?`;

  db.query(sql, [status, id], (err, result) => {
    if (err) {
      return res.status(500).send("Database update failed.");
    }
    // ส่งข้อความไปยัง client ที่เชื่อมต่อทั้งหมด
    io.emit("statusUpdate", { status, id });
  });
};

module.exports = updateStatus;
