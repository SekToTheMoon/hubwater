const express = require("express");
const router = express.Router();
const { db } = require("../../database");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const { uploadAvatar } = require("../../middleware/diskStorage");
const { getNextID } = require("../../utils/generateId");

router.get("/employee", function (req, res) {
  let fetchUser =
    "select e.employee_id,CONCAT(e.employee_fname, ' ', e.employee_lname) AS name, GROUP_CONCAT(t.tel) AS tel, e.employee_email from employee e LEFT JOIN employee_tel t ON e.employee_id=t.employee_id";
  let fetchValue = [];
  const page = parseInt(req.query.page);
  const per_page = parseInt(req.query.per_page);
  const sort_by = req.query.sort_by;
  const sort_type = req.query.sort_type;
  const search = req.query.search;
  const idx_start = (page - 1) * per_page;

  if (sort_by && sort_type) {
    fetchUser += " ORDER BY " + sort_by + " " + sort_type;
  }
  fetchUser += " Where e.employee_del ='0' ";
  if (search) {
    fetchUser += "and e.employee_name LIKE ? ";
    fetchValue.push("%" + search + "%");
  }
  fetchUser += " GROUP BY e.employee_id"; // รวมข้อมูลที่มี customer_id เหมือนกัน
  fetchUser += " limit ?, ?";
  fetchValue.push(idx_start);
  fetchValue.push(per_page);
  db.execute(fetchUser, fetchValue, (err, result, field) => {
    if (!err) {
      db.query(
        "select count(employee_id) as total from employee",
        (err, totalrs) => {
          const total = totalrs[0].total;
          res.json({
            data: result,
            page: page,
            per_page: per_page,
            total: total,
            total_pages: Math.ceil(total / per_page),
          });
        }
      );
    }
  });
});

router.post(
  "/employee/insert",
  uploadAvatar.single("img"),
  async (req, res) => {
    try {
      const {
        commit,
        salary,
        email,
        password,
        fname,
        lname,
        bdate,
        hiredate,
        line,
        sex,
        username,
        nid,
        address,
        phone,
        position,
        subdistrict,
      } = req.body;
      const imageName = req.file.filename;

      const [rows] = await db
        .promise()
        .query(
          "SELECT employee_id FROM employee WHERE employee_nid=? or employee_username=?",
          [nid, username]
        );
      if (rows.length === 0) {
        const hash = await bcrypt.hash(password, saltRounds);
        const employee_id = await getNextID("EMP", "employee");

        db.query(
          `INSERT INTO employee (
              employee_salary,
              employee_commit,
              employee_id, 
              employee_email, 
              employee_password, 
              employee_fname, 
              employee_lname, 
              employee_bdate, 
              employee_hiredate, 
              employee_line, 
              employee_sex, 
              employee_username, 
              employee_nid, 
              employee_address, 
              employee_img,
              employee_del,
              posit_id,
              subdistrict_code) 
              VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            salary,
            commit,
            employee_id,
            email,
            hash,
            fname,
            lname,
            bdate,
            hiredate,
            line,
            sex,
            username,
            nid,
            address,
            imageName,
            0,
            position,
            subdistrict,
          ],
          (err) => {
            if (err) {
              return res.status(500).json({ msg: "insert ผิด" });
            }
            if (phone && phone.length > 0) {
              if (typeof phone === "string") {
                db.query(
                  "INSERT INTO employee_tel (employee_id, tel) VALUES (?, ?)",
                  [employee_id, phone],
                  (err) => {
                    if (err) {
                      return res.status(500).json({
                        msg: "เกิดข้อผิดพลาดในการเพิ่มเบอร์โทรศัพท์พนักงาน",
                      });
                    }
                  }
                );
              } else {
                // กรณีที่ phone เป็นobject หรือ ส่งค่ามา 2 ตัว
                phone.forEach((tel) => {
                  db.query(
                    "INSERT INTO employee_tel (employee_id, tel) VALUES (?, ?)",
                    [employee_id, tel],
                    (err) => {
                      if (err) {
                        return res.status(500).json({
                          msg: "เกิดข้อผิดพลาดในการเพิ่มเบอร์โทรศัพท์พนักงาน",
                        });
                      }
                    }
                  );
                });
              }
            }
            res.status(201).json({
              msg: "เพิ่มพนักงานเรียบร้อยแล้ว",
            });
          }
        );
      } else {
        res.status(409).json({
          msg: "มี Username นี้อยู่ในระบบแล้ว",
        });
      }
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).json({ msg: "Internal Server Error" });
    }
  }
);

router.put(
  "/employee/edit/:id",
  uploadAvatar.single("img"),
  async (req, res) => {
    const employeeId = req.params.id;
    const {
      commit,
      salary,
      email,
      password,
      fname,
      lname,
      bdate,
      hiredate,
      line,
      sex,
      username,
      nid,
      address,
      phone,
      position,
      subdistrict,
    } = req.body;
    const imageName = req.file ? req.file.filename : "";
    // console.log(`
    //     commit: ${commit}
    //     salary: ${salary}
    //     Email: ${email}
    //     Password: ${password}
    //     First Name: ${fname}
    //     Last Name: ${lname}
    //     Birth Date: ${bdate}
    //     Hire Date: ${hiredate}
    //     Line: ${line}
    //     Sex: ${sex}
    //     Username: ${username}
    //     NID: ${nid}
    //     Address: ${address}
    //     phone: ${phone}
    //     Image: ${imageName}
    //     password: ${password}

    //   `);
    try {
      // ตรวจสอบว่ามีลูกค้าที่มีข้อมูลเดียวกันหรือไม่
      const [rows] = await db
        .promise()
        .query(
          "SELECT employee_id FROM employee WHERE employee_fname = ? and employee_lname = ? and employee_nid = ? or employee_username=?",
          [fname, lname, nid, username]
        );
      if (rows.length > 1) {
        return res.status(409).json({
          msg: "มีพนักที่มีข้อมูล หรือ username ซ้ำกันอยู่ในระบบแล้ว",
        });
      }

      let sql = `
  UPDATE employee 
  SET 
  employee_salary = ?,
  employee_commit = ?,
  employee_email = ?, 
  employee_fname = ?, 
  employee_lname = ?, 
  employee_bdate = ?, 
  employee_hiredate = ?, 
  employee_line = ?, 
  employee_sex = ?, 
  employee_username = ?, 
  employee_nid = ?, 
  employee_address = ?, 
  posit_id = ?,
  subdistrict_code = ?
  `;
      let values = [
        salary,
        commit,
        email,
        fname,
        lname,
        bdate,
        hiredate,
        line,
        sex,
        username,
        nid,
        address,
        position,
        subdistrict,
      ];

      if (password.length > 0) {
        sql += ", employee_password = ?";
        const hash = await bcrypt.hash(password, saltRounds);
        console.log(hash);
        values.push(hash);
      }
      if (imageName.length > 0) {
        sql += ", employee_img = ?";
        values.push(imageName);
      }
      sql += " WHERE employee_id = ?;";
      values.push(employeeId);

      db.execute(sql, values, (err, result) => {
        if (err) {
          return res.status(500).json({ msg: "อัพเดท ผิด" });
        }

        db.query(
          "SELECT tel FROM employee_tel WHERE employee_id=?",
          [employeeId],
          (err, rows) => {
            if (err) {
              return res
                .status(500)
                .json({ msg: "เกิดข้อผิดพลาดในการดึงข้อมูลโทรศัพท์พนักงาน" });
            }
            if (phone && Array.isArray(phone)) {
              phone.forEach((tel, index) => {
                if (rows[index] && rows[index].tel !== tel) {
                  db.query(
                    "UPDATE employee_tel SET tel = ? where employee_id = ? and tel = ? ;",
                    [tel, employeeId, rows[index].tel],
                    (err) => {
                      if (err) {
                        console.log(err);
                        return res.status(500).json({
                          msg: "เกิดข้อผิดพลาดในการแก้ไขเบอร์โทรศัพท์พนักงาน",
                        });
                      }
                    }
                  );
                } else if (rows[index] && rows[index].tel === tel) {
                  return; // ข้ามการดำเนินการถ้าหมายเลขโทรศัพท์ในฐานข้อมูลเท่ากับหมายเลขโทรศัพท์ที่ส่งมา
                } else {
                  db.query(
                    "INSERT INTO employee_tel (employee_id, tel) VALUES (?, ?)",
                    [employeeId, tel],
                    (err) => {
                      if (err) {
                        console.log(err);
                        return res.status(500).json({
                          msg: "เกิดข้อผิดพลาดในการเพิ่มเบอร์โทรศัพท์พนักงาน",
                        });
                      }
                    }
                  );
                }
              });
            }
            return res
              .status(201)
              .json({ msg: "แก้ไขข้อมูลพนักงานเรียบร้อยแล้ว" });
          }
        );
      });
    } catch (err) {
      console.log(err);
      return res.status(500).send(err);
    }
  }
);

router.get("/getemployee/:id", (req, res) => {
  const id = req.params.id;
  const sql = `
    SELECT c.*, GROUP_CONCAT(ct.tel) as phone,
    p.code as province, d.code as district,po.dep_id
    FROM employee c
    LEFT JOIN employee_tel ct ON c.employee_id = ct.employee_id
    LEFT JOIN posit po ON c.posit_id = po.posit_id
    LEFT JOIN subdistrict s ON c.subdistrict_code = s.code
    LEFT JOIN district d ON s.district_code = d.code
    LEFT JOIN provinces p ON d.province_code = p.code
    WHERE c.employee_id = ?
    GROUP BY c.employee_id;
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

router.get("/getempselectposit/:id", (req, res) => {
  const id = req.params.id;
  const sql = "select posit_id,posit_name from posit where dep_id =?";
  db.query(sql, [id], (err, data) => {
    if (err) {
      return res.json(err);
    }
    return res.json(data);
  });
});

router.delete("/employeephone/delete/:id/:tel", (req, res) => {
  const sql = `
    DELETE FROM employee_tel WHERE employee_id= ? and tel =? ;
    `;
  const values = [req.params.id, req.params.tel];
  db.execute(sql, values, (err, result) => {
    if (err) {
      console.error("Error delete phone employee:", err);
      res.status(500).json({
        msg: "Error delete phone employee",
      });
      return;
    }
    console.log("delete successfully");
    res.status(201).json({
      msg: "ลบเบอร์โทรศัพท์พนักงานเรียบร้อยแล้ว",
    });
    return;
  });
});

router.delete("/employee/delete/:id", (req, res) => {
  const sql = `
      UPDATE employee 
      SET 
        employee_del = ?
      WHERE employee_id = ?;
    `;
  const id = req.params.id;
  const values = ["1", id];
  db.execute(sql, values, (err, result) => {
    if (err) {
      res.status(500).json({
        msg: "Error delete employee",
      });
      return;
    }
    console.log("Employee delete successfully");
    res.status(201).json({
      msg: "ลบพนักงานเรียบร้อยแล้ว",
      data: result,
    });
    return;
  });
});

module.exports = router;

//   router.post("/register", uploadAvatar.single("img"), async (req, res) => {
//     console.log("inregister");
//     try {
//       console.log("Received POST request at /register");
//       const {
//         email,
//         password,
//         fname,
//         lname,
//         bdate,
//         hiredate,
//         line,
//         sex,
//         username,
//         nid,
//         address,
//         img,
//         phone,
//       } = req.body;
//       const imageName = req.file.filename;
//       console.log(`
//         Email: ${email}
//         Password: ${password}
//         First Name: ${fname}
//         Last Name: ${lname}
//         Birth Date: ${bdate}
//         Hire Date: ${hiredate}
//         Line: ${line}
//         Sex: ${sex}
//         Username: ${username}
//         NID: ${nid}
//         Address: ${address}
//         phone: ${phone}
//         Image: ${imageName}
//       `);

//       const [rows] = await db
//         .promise()
//         .query(
//           "SELECT employee_username FROM employee WHERE employee_username = ?",
//           [username]
//         );

//       if (rows.length === 0) {
//         const hash = await bcrypt.hash(password, saltRounds);
//         const employee_id = getNextID("EMP", "employee");
//         const next = db.execute(
//           `SELECT 'EMP || LPAD(NVL(MAX(SUBSTR(employee_id, 3, 7)), 0) + 1, 7, '0') FROM employee;`
//         );
//         console.log(next[0][0], " ไอดีของ พนักงานต่อไป");
//         await db
//           .promise()
//           .query(
//             "INSERT INTO employee (employee_id, employee_email, employee_password, employee_fname, employee_lname, employee_bdate, employee_hiredate, employee_line, employee_sex, employee_username, employee_nid, employee_address, employee_img) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
//             [
//               employee_id,
//               email,
//               hash,
//               fname,
//               lname,
//               bdate,
//               hiredate,
//               line,
//               sex,
//               username,
//               nid,
//               address,
//               img,
//             ]
//           );

//         res.status(201).json({
//           msg: "เพิ่มพนักงานเรียบร้อยแล้ว",
//         });
//       } else {
//         res.status(409).json({
//           msg: "มี Username นี้อยู่ในระบบแล้ว",
//         });
//       }
//     } catch (error) {
//       console.error("Error during registration:", error);
//       res.status(500).json({ msg: "Internal Server Error" });
//     }
//   });
