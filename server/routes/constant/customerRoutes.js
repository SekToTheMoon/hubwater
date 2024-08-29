const express = require("express");
const router = express.Router();
const { db } = require("../../database");
const { getNextID } = require("../../utils/generateId");

router.get("/customer", function (req, res) {
  let fetch =
    "SELECT customer.customer_id, CONCAT(customer_fname,' ',customer_lname) AS customer_name, GROUP_CONCAT(tel) AS tel, customer_email, customer_type FROM customer LEFT JOIN customer_tel ON customer.customer_id=customer_tel.customer_id";
  let fetchValue = [];
  const page = parseInt(req.query.page);
  const per_page = parseInt(req.query.per_page);
  const sort_by = req.query.sort_by;
  const sort_type = req.query.sort_type;
  const search = req.query.search;
  const idx_start = (page - 1) * per_page;

  if (sort_by && sort_type) {
    fetch += " ORDER BY " + sort_by + " " + sort_type;
  }
  fetch += " WHERE customer.customer_del ='0' ";
  if (search) {
    fetch += "AND customer.customer_name LIKE ? ";
    fetchValue.push("%" + search + "%");
  }
  fetch += " GROUP BY customer.customer_id"; // รวมข้อมูลที่มี customer_id เหมือนกัน
  fetch += " LIMIT ?, ?";
  fetchValue.push(idx_start);
  fetchValue.push(per_page);
  db.execute(fetch, fetchValue, (err, result, field) => {
    if (!err) {
      db.query(
        "SELECT COUNT(customer_id) AS total FROM customer WHERE customer_del='0'",
        (err, totalrs) => {
          if (!err) {
            const total = totalrs[0].total;
            res.json({
              data: result,
              page: page,
              per_page: per_page,
              total: total,
              total_pages: Math.ceil(total / per_page),
            });
          } else {
            res.json({ msg: "query น่าจะผิด" });
          }
        }
      );
    } else {
      res.json({ msg: err });
    }
  });
});

router.post("/customer/insert", async (req, res) => {
  const [rows] = await db
    .promise()
    .query(
      "SELECT customer_id FROM customer WHERE customer_fname = ? and customer_lname=? and customer_nid=?",
      [req.body.customer_fname, req.body.customer_lname, req.body.customer_nid]
    );
  if (rows.length === 0) {
    const sql = `INSERT INTO customer (customer_id, customer_fname, customer_lname, customer_address, customer_type, customer_nid, customer_line, customer_fb, customer_email, customer_sex, customer_bdate, customer_del, subdistrict_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
    const idnext = await getNextID("CUS", "customer");
    db.query(
      sql,
      [
        idnext,
        req.body.fname,
        req.body.lname,
        req.body.address,
        req.body.type,
        req.body.nid,
        req.body.line,
        req.body.facebook,
        req.body.email,
        req.body.sex,
        req.body.bdate,
        "0",
        req.body.subdistrict,
      ],
      (err) => {
        if (err) {
          return res.status(500).json({ msg: "insert ผิด" });
        }
        if (req.body.type === "นิติบุคคล") {
          db.query(
            "INSERT INTO corporation (customer_id, le_type, le_name, le_tax, b_name, b_num) VALUES (?, ?, ?, ?, ?, ?)",
            [
              idnext,
              req.body.le_type,
              req.body.le_name,
              req.body.le_tax,
              req.body.b_name,
              req.body.b_num,
            ],
            (err, data) => {
              if (err) {
                return res.status(500).json({
                  msg: "เกิดข้อผิดพลาดในการเพิ่มข้อมูลนิติบุคคล",
                });
              }
            }
          );
        }
        if (req.body.phone) {
          req.body.phone.forEach((tel) => {
            db.query(
              "INSERT INTO customer_tel (customer_id, tel) VALUES (?, ?)",
              [idnext, tel],
              (err, data) => {
                if (err) {
                  return res.status(500).json({
                    msg: "เกิดข้อผิดพลาดในการเพิ่มเบอร์โทรศัพท์ลูกค้า",
                  });
                }
              }
            );
          });
        }
        res.status(201).json({ msg: "เพิ่มข้อมูลลูกค้าสำเร็จ" });
      }
    );
  } else {
    res.status(409).json({
      msg: "มี ตำแหน่ง นี้อยู่ในระบบแล้ว",
    });
  }
});

router.get("/getcustomer/:id", (req, res) => {
  const id = req.params.id;
  const sql = `
    SELECT c.*, co.le_type, co.le_name, co.le_tax, co.b_name, co.b_num, GROUP_CONCAT(ct.tel) as phone,
    p.code as province, d.code as district
    FROM customer c
    LEFT JOIN corporation co ON c.customer_id = co.customer_id
    LEFT JOIN customer_tel ct ON c.customer_id = ct.customer_id
    LEFT JOIN subdistrict s ON c.subdistrict_code = s.code
    LEFT JOIN district d ON s.district_code = d.code
    LEFT JOIN provinces p ON d.province_code = p.code
    WHERE c.customer_id = ?
    GROUP BY c.customer_id;
    `;
  db.query(sql, [id], (err, data) => {
    if (err) {
      return res
        .status(500)
        .json({ msg: "เกิดข้อผิดพลาดในการดึงข้อมูลลูกค้า" });
    } else {
      const sql = `
      SELECT zip_code from subdistrict where code =?;
      `;
      db.query(sql, data[0].subdistrict_code, (err, zip_code) => {
        res.json({
          data: data,
          zip_code: zip_code,
        });
      });
    }
  });
});

// เอา รหัส กับ ชื่อลูกค้าทั้งหมด
router.get("/getcustomers", (req, res) => {
  const sqlWhere = req.query.sqlWhere; // ใช้ req.query เพื่อดึง query parameter ที่ชื่อ sqlWhere
  let sql = `SELECT customer_id, CONCAT(customer_fname, ' ', customer_lname) AS customer_name FROM customer WHERE customer_del = '0'`;

  if (sqlWhere) {
    sql += ` AND customer_id = ?`; // ใช้ parameterized query
    db.query(sql, [sqlWhere], (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  } else {
    db.query(sql, (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  }
});

router.put("/customer/edit/:id", async (req, res) => {
  const customerId = req.params.id;

  // ตรวจสอบว่ามีลูกค้าที่มีข้อมูลเดียวกันหรือไม่
  const [rows] = await db
    .promise()
    .query(
      "SELECT customer_id FROM customer WHERE customer_fname = ? AND customer_lname=? AND customer_nid=? and customer_id",
      [req.body.customer_fname, req.body.customer_lname, req.body.customer_nid]
    );

  // ถ้าไม่มีลูกค้าที่มีข้อมูลเดียวกันอยู่แล้ว
  if (rows.length === 0) {
    const updateCustomerQuery = `
        UPDATE customer 
        SET 
          customer_fname = ?, 
          customer_lname = ?, 
          customer_address = ?, 
          customer_type = ?, 
          customer_nid = ?, 
          customer_line = ?, 
          customer_fb = ?, 
          customer_email = ?, 
          customer_sex = ?, 
          customer_bdate = ?, 
          subdistrict_code = ?
        WHERE 
          customer_id = ?;
      `;

    const updateCustomerValues = [
      req.body.fname,
      req.body.lname,
      req.body.address,
      req.body.type,
      req.body.nid,
      req.body.line,
      req.body.facebook,
      req.body.email,
      req.body.sex,
      req.body.bdate,
      req.body.subdistrict,
      customerId,
    ];

    db.query(updateCustomerQuery, updateCustomerValues, (err, result) => {
      if (err) {
        res.status(500).json({ msg: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลลูกค้า" });
        return;
      }

      // ถ้าเป็นนิติบุคคล
      if (req.body.type === "นิติบุคคล") {
        const updateCorporationQuery = `
            UPDATE corporation 
            SET 
              le_type = ?, 
              le_name = ?, 
              le_tax = ?, 
              b_name = ?, 
              b_num = ?
            WHERE 
              customer_id = ?;
          `;

        const updateCorporationValues = [
          req.body.le_type,
          req.body.le_name,
          req.body.le_tax,
          req.body.b_name,
          req.body.b_num,
          customerId,
        ];

        db.query(
          updateCorporationQuery,
          updateCorporationValues,
          (err, data) => {
            if (err) {
              res.status(500).json({
                msg: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลนิติบุคคล",
              });
              return;
            }
          }
        );
      }

      // ลบเบอร์โทรศัพท์เก่าและเพิ่มเบอร์โทรศัพท์ใหม่
      const deletePhoneQuery = `DELETE FROM customer_tel WHERE customer_id = ?`;
      db.query(deletePhoneQuery, [customerId], (err, result) => {
        if (err) {
          res.status(500).json({
            msg: "เกิดข้อผิดพลาดในการลบเบอร์โทรศัพท์ลูกค้าเก่า",
          });
          return;
        }

        if (req.body.phone) {
          req.body.phone.forEach((tel) => {
            db.query(
              "INSERT INTO customer_tel (customer_id, tel) VALUES (?, ?)",
              [customerId, tel],
              (err, data) => {
                if (err) {
                  res.status(500).json({
                    msg: "เกิดข้อผิดพลาดในการเพิ่มเบอร์โทรศัพท์ลูกค้าใหม่",
                  });
                  return;
                }
              }
            );
          });
        }
      });

      res.status(200).json({ msg: "อัปเดตข้อมูลลูกค้าสำเร็จ" });
    });
  } else {
    res.status(409).json({ msg: "มีลูกค้าที่มีข้อมูลเดียวกันอยู่ในระบบแล้ว" });
  }
});

router.delete("/customer/delete/:id", (req, res) => {
  const sql = `
      UPDATE customer 
      SET 
        customer_del = ?
      WHERE customer_id = ?;
    `;
  const id = req.params.id;
  const values = ["1", id];
  db.execute(sql, values, (err, result) => {
    if (err) {
      res.status(500).json({
        msg: "Error delete customer" + err,
      });
      return;
    }
    res.status(201).json({
      msg: "ลบตำแหน่งเรียบร้อยแล้ว",
      data: result,
    });
    return;
  });
});
module.exports = router;
