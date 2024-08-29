const express = require("express");
const router = express.Router();
const { db } = require("../database");
const getMonthInThai = require("../utils/monthInThai");

router.get("/getIncome", async (req, res) => {
  const { timeline } = req.query;

  let sqlTotalIncome;
  let sqlIncome;
  const LabelData = [];
  const currentDate = new Date();
  let startDate;
  let totalIncomeAmounts = [];
  let incomeAmounts = [];

  if (timeline == "year") {
    sqlTotalIncome = `SELECT 
      DATE_FORMAT(iv_date, '%Y-%m') AS month, SUM(iv_total) AS total_income
      FROM invoice
      WHERE iv_status = 'ดำเนินการแล้ว'
      AND iv_del = '0'
      AND iv_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 11 MONTH) AND CURDATE()
      GROUP BY 
      DATE_FORMAT(iv_date, '%Y-%m')
      ORDER BY 
      DATE_FORMAT(iv_date, '%Y-%m');`;

    sqlIncome = `SELECT 
      DATE_FORMAT(i.iv_date, '%Y-%m') AS month,
      SUM(rc_total) AS total_received
      FROM 
      receipt
      JOIN (select h.rc_id ,iv_date from invoice 
      join invoice_has_receipt h on invoice.iv_id = h.iv_id 
      WHERE iv_status = 'ดำเนินการแล้ว' and iv_del = '0' ) i on receipt.rc_id = i.rc_id
      WHERE 
      rc_status = 'เก็บเงินแล้ว'
      AND i.iv_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 11 MONTH) AND CURDATE()
      AND rc_del = '0'
      GROUP BY 
      DATE_FORMAT(i.iv_date, '%Y-%m')
      ORDER BY 
      DATE_FORMAT(i.iv_date, '%Y-%m')
      ;`;

    const [TotalIncomeRows] = await db.promise().query(sqlTotalIncome);
    const [IncomeRows] = await db.promise().query(sqlIncome);

    startDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 11,
      1
    );

    // สร้าง set ที่มีให้ มี key เป็นวันที่ ที่มีผลรวมเงินของแต่ละวัน ที่มีข้อมูล
    const totalIncomeMap = new Map();
    TotalIncomeRows.forEach((row) => {
      totalIncomeMap.set(row.month, parseInt(row.total_income));
    });

    const incomeMap = new Map();
    IncomeRows.forEach((row) => {
      incomeMap.set(row.month, parseInt(row.total_received));
    });
    // สร้าง labelDate สำหรับ กราฟ
    while (startDate <= currentDate) {
      LabelData.push(
        `${getMonthInThai(startDate.getMonth())}-${startDate.getFullYear()}`
      );

      let monthTotalIncome = 0;
      let monthIncome = 0;
      const dateKey = `${startDate.getFullYear()}-${(startDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      if (totalIncomeMap.has(dateKey)) {
        monthTotalIncome += totalIncomeMap.get(dateKey);
      }
      if (incomeMap.has(dateKey)) {
        monthIncome += incomeMap.get(dateKey);
      }
      totalIncomeAmounts.push(monthTotalIncome);
      incomeAmounts.push(monthIncome);

      startDate.setMonth(startDate.getMonth() + 1);
    }
  } else if (timeline == "6month") {
    sqlTotalIncome = `Select
    DATE_FORMAT(iv_date, '%Y-%m') AS month, SUM(iv_total) AS total_income
      FROM invoice
      WHERE iv_status = 'ดำเนินการแล้ว'
      AND iv_del = '0'
      AND iv_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 5 MONTH) AND CURDATE()
      GROUP BY 
      DATE_FORMAT(iv_date, '%Y-%m')
      ORDER BY 
      DATE_FORMAT(iv_date, '%Y-%m');`;

    sqlIncome = `SELECT 
      DATE_FORMAT(i.iv_date, '%Y-%m') AS month,
      SUM(rc_total) AS total_received
      FROM 
      receipt
      JOIN (select h.rc_id ,iv_date from invoice 
      join invoice_has_receipt h on invoice.iv_id = h.iv_id 
      WHERE iv_status = 'ดำเนินการแล้ว' and iv_del = '0' ) i on receipt.rc_id = i.rc_id
      WHERE 
      rc_status = 'เก็บเงินแล้ว'
      AND i.iv_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 5 MONTH) AND CURDATE()
      AND rc_del = '0'
      GROUP BY 
      DATE_FORMAT(i.iv_date, '%Y-%m')
      ORDER BY 
      DATE_FORMAT(i.iv_date, '%Y-%m');`;

    const [TotalIncomeRows] = await db.promise().query(sqlTotalIncome);
    const [IncomeRows] = await db.promise().query(sqlIncome);

    startDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 5,
      1
    );

    // สร้าง set ที่มีให้ มี key เป็นวันที่ ที่มีผลรวมเงินของแต่ละวัน ที่มีข้อมูล
    const totalIncomeMap = new Map();
    TotalIncomeRows.forEach((row) => {
      totalIncomeMap.set(row.month, parseInt(row.total_income));
    });

    const incomeMap = new Map();
    IncomeRows.forEach((row) => {
      incomeMap.set(row.month, parseInt(row.total_received));
    });
    // สร้าง labelDate สำหรับ กราฟ
    while (startDate <= currentDate) {
      LabelData.push(
        `${getMonthInThai(startDate.getMonth())}-${startDate.getFullYear()}`
      );

      let monthTotalIncome = 0;
      let monthIncome = 0;
      const dateKey = `${startDate.getFullYear()}-${(startDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      if (totalIncomeMap.has(dateKey)) {
        monthTotalIncome += totalIncomeMap.get(dateKey);
      }
      if (incomeMap.has(dateKey)) {
        monthIncome += incomeMap.get(dateKey);
      }
      totalIncomeAmounts.push(monthTotalIncome);
      incomeAmounts.push(monthIncome);

      startDate.setMonth(startDate.getMonth() + 1);
    }
  } else if (timeline == "3month") {
    sqlTotalIncome = `SELECT 
      DATE_FORMAT(iv_date, '%Y-%m-%d') AS day_month, SUM(iv_total) AS total_income
      FROM invoice
      WHERE iv_status = 'ดำเนินการแล้ว'
      AND iv_del = '0'
      AND iv_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 2 MONTH) AND CURDATE()
      GROUP BY 
      DATE_FORMAT(iv_date, '%Y-%m-%d')
      ORDER BY 
      DATE_FORMAT(iv_date, '%Y-%m-%d');`;

    sqlIncome = `
      SELECT 
      DATE_FORMAT(i.iv_date, '%Y-%m-%d') AS day_month,
      SUM(rc_total) AS total_received
      FROM 
      receipt
      JOIN (select h.rc_id ,iv_date from invoice 
      join invoice_has_receipt h on invoice.iv_id = h.iv_id 
      WHERE iv_status = 'ดำเนินการแล้ว' and iv_del = '0' ) i on receipt.rc_id = i.rc_id
      WHERE 
      rc_status = 'เก็บเงินแล้ว'
      AND i.iv_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 2 MONTH) AND CURDATE()
      AND rc_del = '0'
      GROUP BY 
      DATE_FORMAT(i.iv_date, '%Y-%m-%d')
      ORDER BY 
      DATE_FORMAT(i.iv_date, '%Y-%m-%d');`;

    startDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 2,
      1
    );
    const endDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    const [TotalIncomeRows] = await db.promise().query(sqlTotalIncome);
    const [IncomeRows] = await db.promise().query(sqlIncome);

    // Create maps for quick lookup
    const totalIncomeMap = new Map();
    TotalIncomeRows.forEach((row) => {
      totalIncomeMap.set(row.day_month, parseInt(row.total_income));
    });

    const incomeMap = new Map();
    IncomeRows.forEach((row) => {
      incomeMap.set(row.day_month, parseInt(row.total_received));
    });

    while (startDate <= endDate) {
      const year = startDate.getFullYear();
      const month = startDate.getMonth();
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

      for (let week = 1; week <= 4; week++) {
        let weekStart = startDate.getDate();
        let weekEnd;
        if (week === 4) {
          weekEnd = lastDayOfMonth;
        } else {
          weekEnd = weekStart + 6;
        }

        LabelData.push(`${weekStart}-${weekEnd} ${getMonthInThai(month)}`);

        let weekTotalIncome = 0;
        let weekIncome = 0;
        for (let day = weekStart; day <= weekEnd; day++) {
          const dateKey = `${year}-${(month + 1)
            .toString()
            .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
          if (totalIncomeMap.has(dateKey)) {
            weekTotalIncome += totalIncomeMap.get(dateKey);
          }
          if (incomeMap.has(dateKey)) {
            weekIncome += incomeMap.get(dateKey);
          }
        }
        totalIncomeAmounts.push(weekTotalIncome);
        incomeAmounts.push(weekIncome);

        startDate.setDate(weekEnd + 1);
        if (week === 4) {
          break;
        }
      }
    }
  } else {
    sqlTotalIncome = `
    SELECT 
      DATE_FORMAT(iv_date, '%m-%d') AS day_month, SUM(iv_total) AS total_income
      FROM invoice
      WHERE iv_status = 'ดำเนินการแล้ว'
      AND iv_del = '0'
      AND DATE_FORMAT(iv_date, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
      GROUP BY 
      DATE_FORMAT(iv_date, '%m-%d')
      ORDER BY 
      DATE_FORMAT(iv_date, '%m-%d');`;

    sqlIncome = `
    SELECT 
      DATE_FORMAT(i.iv_date, '%m-%d') AS day_month,
      SUM(rc_total) AS total_received
      FROM 
      receipt
      JOIN (select h.rc_id ,iv_date from invoice 
      join invoice_has_receipt h on invoice.iv_id = h.iv_id 
      WHERE iv_status = 'ดำเนินการแล้ว' and iv_del = '0' ) i on receipt.rc_id = i.rc_id
      WHERE 
      rc_status = 'เก็บเงินแล้ว'
      AND DATE_FORMAT(i.iv_date, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
      AND rc_del = '0'
      GROUP BY 
      DATE_FORMAT(i.iv_date, '%Y-%m-%d')
      ORDER BY 
      DATE_FORMAT(i.iv_date, '%Y-%m-%d');`;

    startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    // ดึงข้อมูลจากฐานข้อมูล
    const [TotalIncomeRows] = await db.promise().query(sqlTotalIncome);
    const [IncomeRows] = await db.promise().query(sqlIncome);

    // สร้าง map สำหรับค้นหาข้อมูลได้ง่าย
    const totalIncomeMap = new Map();
    TotalIncomeRows.forEach((row) => {
      totalIncomeMap.set(row.day_month, parseInt(row.total_income));
    });

    const incomeMap = new Map();
    IncomeRows.forEach((row) => {
      incomeMap.set(row.day_month, parseInt(row.total_received));
    });

    // เริ่มลูปจากวันแรกจนถึงวันสุดท้ายของเดือนปัจจุบัน
    for (let day = 1; day <= endDate.getDate(); day++) {
      const month = (startDate.getMonth() + 1).toString().padStart(2, "0");

      LabelData.push(`${day} ${getMonthInThai(startDate.getMonth())}`);

      let dayTotalIncome = 0;
      let dayIncome = 0;

      const dateKey = `${month}-${day.toString().padStart(2, "0")}`;

      if (totalIncomeMap.has(dateKey)) {
        dayTotalIncome += totalIncomeMap.get(dateKey);
      }
      if (incomeMap.has(dateKey)) {
        dayIncome += incomeMap.get(dateKey);
      }

      totalIncomeAmounts.push(dayTotalIncome);
      incomeAmounts.push(dayIncome);

      startDate.setDate(startDate.getDate() + 1);
    }
  }

  try {
    res.status(200).json({
      labels: LabelData,
      totalIncomeData: totalIncomeAmounts,
      incomeData: incomeAmounts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  }
});

router.get("/getExpense", async (req, res) => {
  const { timeline } = req.query;

  let sqlTotalIncome;
  let sqlIncome;
  const LabelData = [];
  const currentDate = new Date();
  let startDate;
  let totalExpenseAmounts = [];
  let expenseAmounts = [];

  if (timeline === "year") {
    sqlTotalIncome = `SELECT 
      DATE_FORMAT(out_date, '%Y-%m') AS month, SUM(out_total) AS total_income
      FROM expense
      WHERE out_status != 'ไม่อนุมัติ'
      AND out_del = '0'
      AND out_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 11 MONTH) AND CURDATE()
      GROUP BY 
      DATE_FORMAT(out_date, '%Y-%m')
      ORDER BY 
      DATE_FORMAT(out_date, '%Y-%m');`;

    sqlIncome = `SELECT 
      DATE_FORMAT(out_date, '%Y-%m') AS month,
      SUM(out_total) AS total_income
      FROM expense
      WHERE out_status = 'จ่ายแล้ว'
      AND out_del = '0'
      AND out_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 11 MONTH) AND CURDATE()
      GROUP BY 
      DATE_FORMAT(out_date, '%Y-%m')
      ORDER BY 
      DATE_FORMAT(out_date, '%Y-%m');`;

    const [TotalIncomeRows] = await db.promise().query(sqlTotalIncome);
    const [IncomeRows] = await db.promise().query(sqlIncome);

    startDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 11,
      1
    );

    const totalIncomeMap = new Map();
    TotalIncomeRows.forEach((row) => {
      totalIncomeMap.set(row.month, parseInt(row.total_income, 10));
    });

    const incomeMap = new Map();
    IncomeRows.forEach((row) => {
      incomeMap.set(row.month, parseInt(row.total_income, 10)); // Changed from row.total_received to row.total_income
    });

    while (startDate <= currentDate) {
      LabelData.push(
        `${getMonthInThai(startDate.getMonth())}-${startDate.getFullYear()}`
      );

      let monthTotalIncome = 0;
      let monthIncome = 0;
      const dateKey = `${startDate.getFullYear()}-${(startDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;

      if (totalIncomeMap.has(dateKey)) {
        monthTotalIncome += totalIncomeMap.get(dateKey);
      }
      if (incomeMap.has(dateKey)) {
        monthIncome += incomeMap.get(dateKey);
      }
      totalExpenseAmounts.push(monthTotalIncome);
      expenseAmounts.push(monthIncome);

      startDate.setMonth(startDate.getMonth() + 1);
    }
  } else if (timeline == "6month") {
    sqlTotalIncome = `SELECT 
      DATE_FORMAT(out_date, '%Y-%m') AS month, SUM(out_total) AS total_income
      FROM expense
      WHERE out_status != 'ไม่อนุมัติ'
      AND out_del = '0'
      AND out_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 5 MONTH) AND CURDATE()
      GROUP BY 
      DATE_FORMAT(out_date, '%Y-%m')
      ORDER BY 
      DATE_FORMAT(out_date, '%Y-%m');`;

    sqlIncome = `SELECT 
      DATE_FORMAT(out_date, '%Y-%m') AS month,
      SUM(out_total) AS total_income
      FROM expense
      WHERE out_status = 'จ่ายแล้ว'
      AND out_del = '0'
      AND out_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 5 MONTH) AND CURDATE()
      GROUP BY 
      DATE_FORMAT(out_date, '%Y-%m')
      ORDER BY 
      DATE_FORMAT(out_date, '%Y-%m');`;

    const [TotalIncomeRows] = await db.promise().query(sqlTotalIncome);
    const [IncomeRows] = await db.promise().query(sqlIncome);

    startDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 5,
      1
    );

    // สร้าง set ที่มีให้ มี key เป็นวันที่ ที่มีผลรวมเงินของแต่ละวัน ที่มีข้อมูล
    const totalIncomeMap = new Map();
    TotalIncomeRows.forEach((row) => {
      totalIncomeMap.set(row.month, parseInt(row.total_income));
    });

    const incomeMap = new Map();
    IncomeRows.forEach((row) => {
      incomeMap.set(row.month, parseInt(row.total_income));
    });
    // สร้าง labelDate สำหรับ กราฟ
    while (startDate <= currentDate) {
      LabelData.push(
        `${getMonthInThai(startDate.getMonth())}-${startDate.getFullYear()}`
      );

      let monthTotalIncome = 0;
      let monthIncome = 0;
      const dateKey = `${startDate.getFullYear()}-${(startDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
      if (totalIncomeMap.has(dateKey)) {
        monthTotalIncome += totalIncomeMap.get(dateKey);
      }
      if (incomeMap.has(dateKey)) {
        monthIncome += incomeMap.get(dateKey);
      }
      totalExpenseAmounts.push(monthTotalIncome);
      expenseAmounts.push(monthIncome);

      startDate.setMonth(startDate.getMonth() + 1);
    }
  } else if (timeline == "3month") {
    sqlTotalIncome = `SELECT 
      DATE_FORMAT(out_date, '%Y-%m-%d') AS day_month, SUM(out_total) AS total_income
      FROM expense
      WHERE out_status != 'ไม่อนุมัติ'
      AND out_del = '0'
      AND out_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 2 MONTH) AND CURDATE()
      GROUP BY 
      DATE_FORMAT(out_date, '%Y-%m-%d')
      ORDER BY 
      DATE_FORMAT(out_date, '%Y-%m-%d');`;

    sqlIncome = `SELECT 
      DATE_FORMAT(out_date, '%Y-%m-%d') AS day_month,
      SUM(out_total) AS total_received
      FROM 
      expense
      WHERE 
      out_status = 'จ่ายแล้ว'
      AND out_del = '0'
      AND out_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 2 MONTH) AND CURDATE()
      GROUP BY 
      DATE_FORMAT(out_date, '%Y-%m-%d')
      ORDER BY 
      DATE_FORMAT(out_date, '%Y-%m-%d')
      ;`;

    startDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 2,
      1
    );
    const endDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    const [TotalIncomeRows] = await db.promise().query(sqlTotalIncome);
    const [IncomeRows] = await db.promise().query(sqlIncome);

    // Create maps for quick lookup
    const totalIncomeMap = new Map();
    TotalIncomeRows.forEach((row) => {
      totalIncomeMap.set(row.day_month, parseInt(row.total_income));
    });

    const incomeMap = new Map();
    IncomeRows.forEach((row) => {
      incomeMap.set(row.day_month, parseInt(row.total_received));
    });

    while (startDate <= endDate) {
      const year = startDate.getFullYear();
      const month = startDate.getMonth();
      const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

      for (let week = 1; week <= 4; week++) {
        let weekStart = startDate.getDate();
        let weekEnd;
        if (week === 4) {
          weekEnd = lastDayOfMonth;
        } else {
          weekEnd = weekStart + 6;
        }

        LabelData.push(`${weekStart}-${weekEnd} ${getMonthInThai(month)}`);

        let weekTotalIncome = 0;
        let weekIncome = 0;
        for (let day = weekStart; day <= weekEnd; day++) {
          const dateKey = `${year}-${(month + 1)
            .toString()
            .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
          if (totalIncomeMap.has(dateKey)) {
            weekTotalIncome += totalIncomeMap.get(dateKey);
          }
          if (incomeMap.has(dateKey)) {
            weekIncome += incomeMap.get(dateKey);
          }
        }
        totalExpenseAmounts.push(weekTotalIncome);
        expenseAmounts.push(weekIncome);

        startDate.setDate(weekEnd + 1);
        if (week === 4) {
          break;
        }
      }
    }
  } else {
    sqlTotalIncome = `SELECT 
    DATE_FORMAT(out_date, '%m-%d') AS day_month, 
    SUM(out_total) AS total_income
FROM 
    expense
WHERE 
    out_status != 'ไม่อนุมัติ'
    AND out_del = '0'
    AND DATE_FORMAT(out_date, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
GROUP BY 
    DATE_FORMAT(out_date, '%m-%d')
ORDER BY 
    DATE_FORMAT(out_date, '%m-%d');`;

    sqlIncome = `SELECT 
    DATE_FORMAT(out_date, '%m-%d') AS day_month,
    SUM(out_total) AS total_received
    FROM 
    expense
    WHERE 
    out_status = 'จ่ายแล้ว'
    AND out_del = '0'
    AND DATE_FORMAT(out_date, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')
    GROUP BY 
    DATE_FORMAT(out_date, '%m-%d')
    ORDER BY 
    DATE_FORMAT(out_date, '%m-%d')
    ;`;

    startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      0
    );

    // ดึงข้อมูลจากฐานข้อมูล
    const [TotalIncomeRows] = await db.promise().query(sqlTotalIncome);
    const [IncomeRows] = await db.promise().query(sqlIncome);

    // สร้าง map สำหรับค้นหาข้อมูลได้ง่าย
    const totalIncomeMap = new Map();
    TotalIncomeRows.forEach((row) => {
      totalIncomeMap.set(row.day_month, parseInt(row.total_income));
    });

    const incomeMap = new Map();
    IncomeRows.forEach((row) => {
      incomeMap.set(row.day_month, parseInt(row.total_received));
    });

    // เริ่มลูปจากวันแรกจนถึงวันสุดท้ายของเดือนปัจจุบัน
    for (let day = 1; day <= endDate.getDate(); day++) {
      const month = (startDate.getMonth() + 1).toString().padStart(2, "0");

      LabelData.push(`${day} ${getMonthInThai(startDate.getMonth())}`);

      let dayTotalIncome = 0;
      let dayIncome = 0;

      const dateKey = `${month}-${day.toString().padStart(2, "0")}`;

      if (totalIncomeMap.has(dateKey)) {
        dayTotalIncome += totalIncomeMap.get(dateKey);
      }
      if (incomeMap.has(dateKey)) {
        dayIncome += incomeMap.get(dateKey);
      }

      totalExpenseAmounts.push(dayTotalIncome);
      expenseAmounts.push(dayIncome);

      startDate.setDate(startDate.getDate() + 1);
    }
  }

  try {
    res.status(200).json({
      labels: LabelData,
      totalExpenseData: totalExpenseAmounts,
      expenseData: expenseAmounts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  }
});

// router.get("/getSaleProduct", async (req, res) => {
//   const { startDate, endDate } = req.query;

//   const sql = `SELECT
//       P.product_name,
//       SUM(I.listi_amount) AS total_quantity_sold,
//       SUM(I.listi_amount * I.listi_price) AS total_sales_amount
// FROM
//       listi I
// JOIN
//       Product P ON I.product_id = P.product_id
// WHERE
//       I.iv_id IN (SELECT iv_id FROM invoice WHERE iv_del = '0'
//       AND iv_date BETWEEN ? AND ?)
// GROUP BY
//       P.product_name;
// `;

// // สร้างอาร์เรย์สำหรับเก็บค่า parameters
// const params = [startDate, endDate];

//   try {
//     const [SaleProduct] = await db.promise().query(sql,params);

//     res.status(200).json(SaleProduct);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
//   }
// });

router.get("/getSaleProduct", async (req, res) => {
  const { startDate, endDate } = req.query;

  const sql = `SELECT 
      P.product_name, 
      SUM(I.listi_amount) AS total_quantity_sold,
      SUM(I.listi_amount * I.listi_price) AS total_sales_amount,
      DATE_FORMAT(iv.iv_date, '%Y-%m-%d') AS sale_date
FROM 
      listi I
JOIN 
      Product P ON I.product_id = P.product_id
JOIN
      invoice iv ON I.iv_id = iv.iv_id
WHERE 
      iv.iv_del = '0'
      AND iv.iv_date BETWEEN ? AND ?
GROUP BY 
      P.product_name, sale_date
ORDER BY
      sale_date;`;

  const params = [startDate, endDate];

  try {
    const [SaleProductRows] = await db.promise().query(sql, params);

    // Aggregate data by product name
    const productDataMap = new Map();
    const labels = [];

    SaleProductRows.forEach((row) => {
      const { product_name, total_sales_amount, sale_date } = row;

      // Add date to labels if not already present
      if (!labels.includes(sale_date)) {
        labels.push(sale_date);
      }

      if (!productDataMap.has(product_name)) {
        productDataMap.set(product_name, []);
      }

      const productSales = productDataMap.get(product_name);

      // Initialize data array with zeroes up to the current length of labels
      while (productSales.length < labels.length - 1) {
        productSales.push(0);
      }

      productSales.push(total_sales_amount);
    });

    // Ensure all product datasets are the same length as labels
    productDataMap.forEach((sales, productName) => {
      while (sales.length < labels.length) {
        sales.push(0);
      }
    });

    const datasets = Array.from(productDataMap.entries()).map(
      ([product_name, data]) => ({
        label: product_name,
        data: data,

        borderWidth: 1,
      })
    );

    res.status(200).json({
      labels: labels,
      datasets: datasets,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  }
});

router.get("/getExpenseByCategory", async (req, res) => {
  const { timeline } = req.query;
  let condition;
  if (timeline == "year") {
    condition =
      " AND out_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 11 MONTH) AND CURDATE()";
  } else if (timeline == "6month") {
    condition =
      " AND out_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 5 MONTH) AND CURDATE()";
  } else if (timeline == "3month") {
    condition =
      " AND out_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 2 MONTH) AND CURDATE()";
  } else {
    condition =
      " AND DATE_FORMAT(out_date, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')";
  }
  const sql = `SELECT 
      t.expensetype_name, 
      SUM(listo_total) AS total_expense_amount
FROM 
      listout o
JOIN 
      expensetype t ON t.expensetype_id = o.expensetype_id
WHERE 
      o.out_id IN (SELECT out_id FROM expense WHERE out_del = '0'
      and out_status = 'จ่ายแล้ว'
      ${condition})
GROUP BY 
      t.expensetype_id;
`;

  try {
    const [SaleProduct] = await db.promise().query(sql);

    res.status(200).json(SaleProduct);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  }
});

router.get("/getCommition", async (req, res) => {
  const { timeline } = req.query;
  let condition;
  if (timeline == "year") {
    condition =
      " AND iv_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 11 MONTH) AND CURDATE()";
  } else if (timeline == "6month") {
    condition =
      " AND iv_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 5 MONTH) AND CURDATE()";
  } else if (timeline == "3month") {
    condition =
      " AND iv_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 2 MONTH) AND CURDATE()";
  } else {
    condition =
      " AND DATE_FORMAT(iv_date, '%Y-%m') = DATE_FORMAT(CURDATE(), '%Y-%m')";
  }
  const sql = `SELECT 
      e.employee_fname,e.employee_lname, e.employee_id,
      ROUND(SUM(iv_total * (e.employee_commit / 100)), 2) AS total_commission
FROM 
      invoice
JOIN 
      employee e ON invoice.employee_id = e.employee_id
WHERE 
      iv_id IN (SELECT iv_id FROM invoice WHERE iv_del = '0'
      and iv_status = 'ดำเนินการแล้ว'
      ${condition})
GROUP BY 
      e.employee_id;
`;

  try {
    const [commitionData] = await db.promise().query(sql);

    res.status(200).json(commitionData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  }
});

router.get("/getTopSale", async (req, res) => {
  const { startDate, endDate, category } = req.query;
  console.log(startDate, endDate, category);
  let sql = `
  SELECT 
      P.product_id,
      P.product_img,
      P.product_name,
      P.product_price,
      SUM(I.listi_amount) AS total_quantity_sold,
      SUM(I.listi_amount * I.listi_price) AS total_sales_amount
  FROM 
      listi I
  JOIN 
      Product P ON I.product_id = P.product_id
  JOIN 
      type T ON P.type_id = T.type_id
  WHERE 
      I.iv_id IN (
        SELECT iv_id 
        FROM invoice 
        WHERE iv_del = '0'
        AND iv_date BETWEEN ? AND ?
      )
`;

  // ถ้า category ไม่เท่ากับ 'ทั้งหมด' ให้เพิ่มเงื่อนไข T.type_name
  if (category !== "ทั้งหมด") {
    sql += " AND T.type_category = ?";
  }

  // เพิ่มส่วน GROUP BY
  sql += " GROUP BY P.product_id";

  // สร้างอาร์เรย์สำหรับเก็บค่า parameters
  const params = [startDate, endDate];

  // ถ้า category ไม่เท่ากับ 'ทั้งหมด' ให้เพิ่ม category ในอาร์เรย์ params
  if (category !== "ทั้งหมด") {
    params.push(category);
  }

  try {
    const [topSaleDate] = await db.promise().query(sql, params);
    res.status(200).json(topSaleDate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  }
});

router.get("/getCategoryProduct", async (req, res) => {
  const sql = `SELECT 
      type_id ,type_category from type where type_del ='0'
`;

  try {
    const [typeData] = await db.promise().query(sql);

    res.status(200).json(typeData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล" });
  }
});

module.exports = router;
