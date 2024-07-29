const { db } = require("../database");

const getNextID = async (prefix, tableselect) => {
  const [rows] = await db
    .promise()
    .query(
      `SELECT LPAD(IFNULL(MAX(SUBSTR(??, 4, 4)), 0) + 1, 4, '0') AS next FROM ??;`,
      [`${tableselect}_id`, tableselect]
    );

  console.log(prefix + rows[0].next);
  return prefix + rows[0].next;
};

module.exports = {
  getNextID,
};
