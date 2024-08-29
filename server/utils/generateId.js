const { db } = require("../database");
const moment = require("moment");
// ใช้เครื่องหมาย ?? ในการระบุคอลัมน์และตารางใน MySQL/MariaDB ผ่านการใช้ prepared statements ของ mysql2
// เพระค่าที่รับมาเป็น string
const getNextID = async (prefix, tableselect) => {
  const [rows] = await db
    .promise()
    .query(
      `SELECT LPAD(IFNULL(MAX(SUBSTR(??, 4, 4)), 0) + 1, 4, '0') AS next FROM ??;`,
      [`${tableselect}_id`, tableselect]
    );

  console.log(prefix + rows[0].next + "from generateID");
  return prefix + rows[0].next;
};

const getTransactionID = async (prefix, tableselect, whereDate) => {
  const [rows] = await db
    .promise()
    .query(
      `SELECT LPAD(IFNULL(MAX(SUBSTR(??, 12, 5)), 0) + 1, 5, '0') AS next FROM ?? WHERE ?? = ?;`,
      [`${prefix}_id`, tableselect, `${prefix}_date`, whereDate]
    );

  return prefix + moment(whereDate).format("YYYYMMDD") + "-" + rows[0].next;
};
module.exports = {
  getNextID,
  getTransactionID,
};
