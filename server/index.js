const express = require("express");
const app = express();
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const saltRounds = 10;
const uuid = require("uuid");
const { connect } = require("http2");
const moment = require("moment");
app.use(express.json());
app.use(cors());
const jwt = require("jsonwebtoken");
const { decode } = require("punycode");
require("dotenv").config();
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "hubwater",
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
  } else {
    console.log("Connected to MySQL database");
  }
});

const storageAvatar = multer.diskStorage({
  destination: path.join(__dirname, "img", "avatar"),
  filename: function (req, file, cb) {
    // null as first argument means no error
    cb(null, Date.now() + "-" + uuid.v4().substring(0, 8) + ".png");
  },
});
const storageProduct = multer.diskStorage({
  destination: path.join(__dirname, "img", "product"),
  filename: function (req, file, cb) {
    // null as first argument means no error
    cb(null, Date.now() + "-" + uuid.v4().substring(0, 8) + ".png");
  },
});
const uploadAvatar = multer({ storage: storageAvatar });
const uploadProduct = multer({ storage: storageProduct });

function generateAccessToken(user) {
  return jwt.sign(
    {
      username: user,
    },
    process.env.ACCESS_TOKEN_SECRET
    // { expiresIn: "59s" }
  );
}
function generateRefreshToken(user) {
  return jwt.sign(
    {
      username: user,
    },
    process.env.REFRESH_TOKEN_SECRET
    // { expiresIn: "59s" }
  );
}
let refreshTokens = [];
app.post("/token", (req, res) => {
  const refreshToken = req.body.refreshToken;
  if (refreshToken === null) return res.status(401).send("ไม่มีการส่งมา");
  if (!refreshTokens.includes(refreshToken))
    return res.status(401).send("ไม่มี refreshtoken นี้ในระบบ");
  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    const token = generateAccessToken(user.username);
    console.log("/token is work and this is new accesstoken " + token);
    res.json({ token: token });
  });
});

async function getNextID(prefix, tableselect) {
  const next = await db
    .promise()
    .query(
      `select LPAD(IFNULL(Max(SUBSTR(??, 4, 4)),0)+1,4,'0') as next from ??;`,
      [`${tableselect}_id`, tableselect]
    );
  console.log(prefix + next[0][0].next);
  return prefix + next[0][0].next;
}

app.get("/", (req, res) => {
  res.json({
    msg: "Hello World from server",
  });
});

//อยู๋หน้า all ตรวจสอบผู้ใช้ต้องมี token
app.post("/auth", (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log(token);
    return res.status(200).json(decoded);
  } catch (err) {
    res.status(500).json(err);
  }
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  db.query(
    "SELECT employee_username, employee_password FROM employee WHERE employee_username = ?",
    [username],
    (err, result) => {
      if (err) {
        return res.status(500).json({ msg: err });
      }
      if (result.length > 0) {
        const hashedPassword = result[0].employee_password; // แก้ไขนี้ให้ตรงกับชื่อคอลัมน์ในฐานข้อมูล

        bcrypt.compare(password, hashedPassword, (err, isMatch) => {
          if (err) {
            return res.status(500).json({ msg: err });
          }

          if (isMatch) {
            // ทำการ query ข้อมูล employee ที่ล็อกอินเพื่อสร้าง token
            db.query(
              "SELECT employee_id, employee_img,employee_fname, employee_lname, posit_permission, posit_name FROM employee JOIN posit on employee.posit_id = posit.posit_id WHERE employee_username = ?",
              [username],
              (err, emp) => {
                if (err) {
                  return res.status(500).json({ msg: err });
                }
                const token = generateAccessToken(username);
                const refreshToken = generateRefreshToken(username);
                refreshTokens.push(refreshToken);
                // console.log(refreshTokens); เอาไว้ดูว่ามี refreshtoken กี่ตัวแล้ว
                return res.status(200).json({
                  msg: "Login successful!",
                  employee_id: emp[0].employee_id,
                  employee_fname: emp[0].employee_fname,
                  employee_lname: emp[0].employee_lname,
                  posit_permission: emp[0].posit_permission,
                  posit_name: emp[0].posit_name,
                  employee_img: emp[0].employee_img,
                  token,
                  refreshToken,
                });
              }
            );
          } else {
            return res.status(401).json({
              msg: "Incorrect email or password",
            });
          }
        });
      } else {
        return res.status(401).json({ msg: "Unregistered user!" });
      }
    }
  );
});

app.post("/logout", (req, res) => {
  console.log("this is logout " + req.body.refreshToken);
  refreshTokens = refreshTokens.filter(
    (token) => token !== req.body.refreshToken
  );
  console.log(refreshTokens);
  res.json({ message: "Logout successful", clearLocalStorage: true });
});

app.post("/register", uploadAvatar.single("img"), async (req, res) => {
  console.log("inregister");
  try {
    console.log("Received POST request at /register");
    const {
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
      img,
      phone,
    } = req.body;
    const imageName = req.file.filename;
    console.log(`
      Email: ${email}
      Password: ${password}
      First Name: ${fname}
      Last Name: ${lname}
      Birth Date: ${bdate}
      Hire Date: ${hiredate}
      Line: ${line}
      Sex: ${sex}
      Username: ${username}
      NID: ${nid}
      Address: ${address}
      phone: ${phone}
      Image: ${imageName}
    `);

    const [rows] = await db
      .promise()
      .query(
        "SELECT employee_username FROM employee WHERE employee_username = ?",
        [username]
      );

    if (rows.length === 0) {
      const hash = await bcrypt.hash(password, saltRounds);
      const employee_id = getNextID("EMP", "employee");
      const next = db.execute(
        `SELECT 'EMP || LPAD(NVL(MAX(SUBSTR(employee_id, 3, 7)), 0) + 1, 7, '0') FROM employee;`
      );
      console.log(next[0][0]);
      await db
        .promise()
        .query(
          "INSERT INTO employee (employee_id, employee_email, employee_password, employee_fname, employee_lname, employee_bdate, employee_hiredate, employee_line, employee_sex, employee_username, employee_nid, employee_address, employee_img) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
          [
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
            img,
          ]
        );

      res.status(201).json({
        msg: "เพิ่มพนักงานเรียบร้อยแล้ว",
      });
    } else {
      res.status(409).json({
        msg: "มี Username นี้อยู่ในระบบแล้ว",
      });
    }
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
});

app.get("/department", function (req, res) {
  let fetch = "select dep_id,dep_name from dep";
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
  fetch += " Where dep_del ='0' ";
  if (search) {
    fetch += "and dep_name LIKE ? ";
    fetchValue.push("%" + search + "%");
  }
  fetch += " limit ?, ?";
  fetchValue.push(idx_start);
  fetchValue.push(per_page);
  db.execute(fetch, fetchValue, (err, result, field) => {
    if (!err) {
      db.query(
        "select count(dep_id) as total from dep where dep_del='0'",
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

app.post("/department/insert", async (req, res) => {
  const [rows] = await db
    .promise()
    .query("SELECT dep_name FROM dep WHERE dep_name = ?", [req.body.dep_name]);

  if (rows.length === 0) {
    const sql = "insert into dep (dep_id,dep_name,dep_del) values (?,?,?)";
    const idnext = await getNextID("DEP", "dep");
    console.log(req.body.dep_name);
    db.query(sql, [idnext, req.body.dep_name, "0"], (err, data) => {
      if (err) {
        res.status(500).json({ msg: err });
        return;
      }
      res.status(201).json({
        msg: "เพิ่มแผนกสำเร็จ",
      });
    });
  } else {
    res.status(409).json({
      msg: "มี แผนก นี้อยู่ในระบบแล้ว",
    });
  }
});

app.put("/department/edit/:id", async (req, res) => {
  const [rows] = await db
    .promise()
    .query("SELECT dep_name FROM dep WHERE dep_name = ?", [req.body.dep_name]);

  if (rows.length === 0) {
    const sql = `
  UPDATE dep 
  SET 
    dep_name = ?
  WHERE dep_id = ?;
`;

    const values = [req.body.dep_name];
    const id = req.params.id;
    console.log(id);
    db.query(sql, [...values, id], (err, result) => {
      if (err) {
        res.status(500).json({ msg: "Error updating department" });
        return;
      }
      res.status(201).json({
        msg: "แก้ไขแผนกสำเร็จ",
      });
    });
  } else {
    res.status(409).json({
      msg: "มี แผนก นี้อยู่ในระบบแล้ว",
    });
  }
});

app.get("/getdep/:id", (req, res) => {
  const id = req.params.id;
  if (id == "all") {
    const sql = "select dep_id, dep_name from dep";
    db.query(sql, (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  } else {
    const sql = "select dep_name from dep where dep_id =?";
    db.query(sql, [id], (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  }
});

app.delete("/department/delete/:id", (req, res) => {
  console.log("dep delete");
  const sql = `
    UPDATE dep 
    SET 
      dep_del = ?
    WHERE dep_id = ?;
  `;
  const id = req.params.id;
  const values = ["1", id];
  db.execute(sql, values, (err, result) => {
    if (err) {
      res.status(500).json({
        msg: "Error delete department",
      });
      return;
    }
    console.log("Employee delete successfully");
    res.status(201).json({
      msg: "ลบแผนกเรียบร้อยแล้ว",
      data: result,
    });
    return;
  });
});

app.get("/unit", function (req, res) {
  let fetch = "select unit_id,unit_name from unit";
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
  fetch += " Where unit_del ='0' ";
  if (search) {
    fetch += "and unit_name LIKE ? ";
    fetchValue.push("%" + search + "%");
  }
  fetch += " limit ?, ?";
  fetchValue.push(idx_start);
  fetchValue.push(per_page);
  db.execute(fetch, fetchValue, (err, result, field) => {
    if (!err) {
      db.query(
        "select count(unit_id) as total from unit where unit_del='0'",
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

app.post("/unit/insert", async (req, res) => {
  const [rows] = await db
    .promise()
    .query("SELECT unit_name FROM unit WHERE unit_name = ?", [
      req.body.unit_name,
    ]);

  if (rows.length === 0) {
    const sql = "insert into unit (unit_id,unit_name,unit_del) values (?,?,?)";
    const idnext = await getNextID("UNI", "unit");
    console.log(req.body.unit_name);
    db.query(sql, [idnext, req.body.unit_name, "0"], (err, data) => {
      if (err) {
        res.status(500).json({ msg: err });
        return;
      }
      res.status(201).json({
        msg: "เพิ่มหน่วยนับสำเร็จ",
      });
    });
  } else {
    res.status(409).json({
      msg: "มี หน่วยนับ นี้อยู่ในระบบแล้ว",
    });
  }
});

app.put("/unit/edit/:id", async (req, res) => {
  const [rows] = await db
    .promise()
    .query("SELECT unit_name FROM unit WHERE unit_name = ?", [
      req.body.unit_name,
    ]);

  if (rows.length === 0) {
    const sql = `
  UPDATE unit 
  SET 
    unit_name = ?
  WHERE unit_id = ?;
`;

    const values = [req.body.unit_name];
    const id = req.params.id;
    console.log(id);
    db.query(sql, [...values, id], (err, result) => {
      if (err) {
        res.status(500).json({ msg: "Error updating unit" });
        return;
      }
      res.status(201).json({
        msg: "แก้ไขหน่วยนับสำเร็จ",
      });
    });
  } else {
    res.status(409).json({
      msg: "มี หน่วยนับ นี้อยู่ในระบบแล้ว",
    });
  }
});

app.get("/getunit/:id", (req, res) => {
  const id = req.params.id;
  if (id == "all") {
    const sql = "select unit_id, unit_name from unit";
    db.query(sql, (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  } else {
    const sql = "select unit_name from unit where unit_id =?";
    db.query(sql, [id], (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  }
});

app.delete("/unit/delete/:id", (req, res) => {
  console.log("unit delete");
  const sql = `
    UPDATE unit 
    SET 
      unit_del = ?
    WHERE unit_id = ?;
  `;
  const id = req.params.id;
  const values = ["1", id];
  db.execute(sql, values, (err, result) => {
    if (err) {
      console.error("Error delete employee:", err);
      res.status(500).json({
        msg: "Error delete unit",
      });
      return;
    }
    console.log(" delete successfully");
    res.status(201).json({
      msg: "ลบหน่วยนับเรียบร้อยแล้ว",
      data: result,
    });
    return;
  });
});

app.get("/unit_m", function (req, res) {
  let fetch = "select unit_m_id,unit_m_name from unit_m";
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
  fetch += " Where unit_m_del ='0' ";
  if (search) {
    fetch += "and unit_m_name LIKE ? ";
    fetchValue.push("%" + search + "%");
  }
  fetch += " limit ?, ?";
  fetchValue.push(idx_start);
  fetchValue.push(per_page);
  db.execute(fetch, fetchValue, (err, result, field) => {
    if (!err) {
      db.query(
        "select count(unit_m_id) as total from unit_m where unit_m_del='0'",
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

app.post("/unit_m/insert", async (req, res) => {
  const [rows] = await db
    .promise()
    .query("SELECT unit_m_name FROM unit_m WHERE unit_m_name = ?", [
      req.body.unit_m_name,
    ]);

  if (rows.length === 0) {
    const sql =
      "insert into unit_m (unit_m_id,unit_m_name,unit_m_del) values (?,?,?)";
    const idnext = await getNextID("UNM", "unit_m");
    console.log(req.body.unit_m_name);
    db.query(sql, [idnext, req.body.unit_m_name, "0"], (err, data) => {
      if (err) {
        res.status(500).json({ msg: err });
        return;
      }
      res.status(201).json({
        msg: "เพิ่มหน่วยวัดสำเร็จ",
      });
    });
  } else {
    res.status(409).json({
      msg: "มี หน่วยวัด นี้อยู่ในระบบแล้ว",
    });
  }
});

app.put("/unit_m/edit/:id", async (req, res) => {
  const [rows] = await db
    .promise()
    .query("SELECT unit_m_name FROM unit_m WHERE unit_m_name = ?", [
      req.body.unit_m_name,
    ]);

  if (rows.length === 0) {
    const sql = `
  UPDATE unit_m 
  SET 
    unit_m_name = ?
  WHERE unit_m_id = ?;
`;

    const values = [req.body.unit_m_name];
    const id = req.params.id;
    console.log(id);
    db.query(sql, [...values, id], (err, result) => {
      if (err) {
        res.status(500).json({ msg: "Error updating unit_m" });
        return;
      }
      res.status(201).json({
        msg: "แก้ไขหน่วยวัดสำเร็จ",
      });
    });
  } else {
    res.status(409).json({
      msg: "มี หน่วยวัด นี้อยู่ในระบบแล้ว",
    });
  }
});

app.get("/getunit_m/:id", (req, res) => {
  const id = req.params.id;
  if (id == "all") {
    const sql = "select unit_m_id, unit_m_name from unit_m";
    db.query(sql, (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  } else {
    const sql = "select unit_m_name from unit_m where unit_m_id =?";
    db.query(sql, [id], (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  }
});

app.delete("/unit_m/delete/:id", (req, res) => {
  console.log("unit_m delete");
  const sql = `
    UPDATE unit_m 
    SET 
      unit_m_del = ?
    WHERE unit_m_id = ?;
  `;
  const id = req.params.id;
  const values = ["1", id];
  db.execute(sql, values, (err, result) => {
    if (err) {
      console.error("Error delete employee:", err);
      res.status(500).json({
        msg: "Error delete unit_m",
      });
      return;
    }
    console.log(" delete successfully");
    res.status(201).json({
      msg: "ลบหน่วยวัดเรียบร้อยแล้ว",
      data: result,
    });
    return;
  });
});

app.get("/expensetype", function (req, res) {
  let fetch = "select expensetype_id,expensetype_name from expensetype";
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
  fetch += " Where expensetype_del ='0' ";
  if (search) {
    fetch += "and expensetype_name LIKE ? ";
    fetchValue.push("%" + search + "%");
  }
  fetch += " limit ?, ?";
  fetchValue.push(idx_start);
  fetchValue.push(per_page);
  db.execute(fetch, fetchValue, (err, result, field) => {
    if (!err) {
      db.query(
        "select count(expensetype_id) as total from expensetype where expensetype_del='0'",
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

app.post("/expensetype/insert", async (req, res) => {
  const [rows] = await db
    .promise()
    .query(
      "SELECT expensetype_name FROM expensetype WHERE expensetype_name = ?",
      [req.body.expensetype_name]
    );

  if (rows.length === 0) {
    const sql =
      "insert into expensetype (expensetype_id,expensetype_name,expensetype_del) values (?,?,?)";
    const idnext = await getNextID("EPT", "expensetype");
    console.log(req.body.expensetype_name);
    db.query(sql, [idnext, req.body.expensetype_name, "0"], (err, data) => {
      if (err) {
        res.status(500).json({ msg: err });
        return;
      }
      res.status(201).json({
        msg: "เพิ่มประเภทค่าใช้จ่ายสำเร็จ",
      });
    });
  } else {
    res.status(409).json({
      msg: "มี ประเภทค่าใช้จ่าย นี้อยู่ในระบบแล้ว",
    });
  }
});

app.put("/expensetype/edit/:id", async (req, res) => {
  const [rows] = await db
    .promise()
    .query(
      "SELECT expensetype_name FROM expensetype WHERE expensetype_name = ?",
      [req.body.expensetype_name]
    );

  if (rows.length === 0) {
    const sql = `
  UPDATE expensetype 
  SET 
    expensetype_name = ?
  WHERE expensetype_id = ?;
`;

    const values = [req.body.expensetype_name];
    const id = req.params.id;
    console.log(id);
    db.query(sql, [...values, id], (err, result) => {
      if (err) {
        res.status(500).json({ msg: "Error updating expensetype" });
        return;
      }
      res.status(201).json({
        msg: "แก้ไขประเภทค่าใช้จ่ายสำเร็จ",
      });
    });
  } else {
    res.status(409).json({
      msg: "มี ประเภทค่าใช้จ่าย นี้อยู่ในระบบแล้ว",
    });
  }
});

app.get("/getexpensetype/:id", (req, res) => {
  const id = req.params.id;
  if (id == "all") {
    const sql = "select expensetype_id, expensetype_name from expensetype";
    db.query(sql, (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  } else {
    const sql =
      "select expensetype_name from expensetype where expensetype_id =?";
    db.query(sql, [id], (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  }
});

app.delete("/expensetype/delete/:id", (req, res) => {
  console.log("expensetype delete");
  const sql = `
    UPDATE expensetype 
    SET 
      expensetype_del = ?
    WHERE expensetype_id = ?;
  `;
  const id = req.params.id;
  const values = ["1", id];
  db.execute(sql, values, (err, result) => {
    if (err) {
      console.error("Error delete employee:", err);
      res.status(500).json({
        msg: "Error delete expensetype",
      });
      return;
    }
    console.log(" delete successfully");
    res.status(201).json({
      msg: "ลบประเภทค่าใช้จ่ายเรียบร้อยแล้ว",
      data: result,
    });
    return;
  });
});
app.get("/bank", function (req, res) {
  let fetch =
    "select bank_id,bank_name,bank_num,bank_name,bank_owner from bank";
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
  fetch += " Where bank_del ='0' ";
  if (search) {
    fetch += "and bank_name LIKE ? ";
    fetchValue.push("%" + search + "%");
  }
  fetch += " limit ?, ?";
  fetchValue.push(idx_start);
  fetchValue.push(per_page);
  db.execute(fetch, fetchValue, (err, result, field) => {
    if (!err) {
      db.query(
        "select count(bank_id) as total from bank where bank_del='0'",
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
app.post("/bank/insert", async (req, res) => {
  const [rows] = await db
    .promise()
    .query("SELECT bank_id FROM bank WHERE bank_name = ? and bank_owner = ?", [
      req.body.bank_name,
      req.body.bank_owner,
    ]);

  if (rows.length === 0) {
    const sql =
      "INSERT INTO bank (bank_id, bank_name, bank_branch, bank_owner, bank_type, bank_num, bank_del) VALUES (?, ?, ?, ?, ?, ?, ?)";
    const idnext = await getNextID("BAK", "bank");
    db.query(
      sql,
      [
        idnext,
        req.body.bank_name,
        req.body.bank_branch,
        req.body.bank_owner,
        req.body.bank_type,
        req.body.bank_num,
        "0",
      ],
      (err, data) => {
        if (err) {
          res.status(500).json({ msg: err });
          return;
        }
        res.status(201).json({
          msg: "เพิ่มบัญชีธนาคารสำเร็จ",
        });
      }
    );
  } else {
    res.status(409).json({
      msg: "มี บัญชีธนาคาร นี้อยู่ในระบบแล้ว",
    });
  }
});

app.put("/bank/edit/:id", async (req, res) => {
  const [rows] = await db
    .promise()
    .query(
      "SELECT bank_id FROM bank WHERE bank_name = ? and bank_owner = ? and bank_id != ?",
      [req.body.bank_name, req.body.bank_owner, req.params.id]
    );

  if (rows.length === 0) {
    const sql = `
  UPDATE bank 
  SET 
    bank_name = ?,bank_branch = ?,bank_owner = ?,bank_type = ?,bank_num = ?
  WHERE bank_id = ?;
`;

    const values = [
      req.body.bank_name,
      req.body.bank_branch,
      req.body.bank_owner,
      req.body.bank_type,
      req.body.bank_num,
    ];
    const id = req.params.id;
    db.query(sql, [...values, id], (err, result) => {
      if (err) {
        res.status(500).json({ msg: "Error updating bank" });
        return;
      }
      res.status(201).json({
        msg: "แก้ไขบัญชีธนาคารสำเร็จ",
      });
    });
  } else {
    res.status(409).json({
      msg: "มี บัญชีธนาคาร นี้อยู่ในระบบแล้ว",
    });
  }
});

app.get("/getbank/:id", (req, res) => {
  const id = req.params.id;
  if (id == "all") {
    const sql = "select bank_id, bank_name from bank";
    db.query(sql, (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  } else {
    const sql =
      "select bank_name,bank_branch,bank_owner,bank_type,bank_num from bank where bank_id =?";
    db.query(sql, [id], (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  }
});

app.delete("/bank/delete/:id", (req, res) => {
  console.log("bank delete");
  const sql = `
    UPDATE bank 
    SET 
      bank_del = ?
    WHERE bank_id = ?;
  `;
  const id = req.params.id;
  const values = ["1", id];
  db.execute(sql, values, (err, result) => {
    if (err) {
      console.error("Error delete bank:", err);
      res.status(500).json({
        msg: "Error delete bank",
      });
      return;
    }
    console.log("bank delete successfully");
    res.status(201).json({
      msg: "ลบบัญชีธนาคารเรียบร้อยแล้ว",
      data: result,
    });
    return;
  });
});

app.get("/brand", function (req, res) {
  let fetch = "select brand_id,brand_name from brand";
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
  fetch += " Where brand_del ='0' ";
  if (search) {
    fetch += "and brand_name LIKE ? ";
    fetchValue.push("%" + search + "%");
  }
  fetch += " limit ?, ?";
  fetchValue.push(idx_start);
  fetchValue.push(per_page);
  db.execute(fetch, fetchValue, (err, result, field) => {
    if (!err) {
      db.query(
        "select count(brand_id) as total from brand where brand_del='0'",
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

app.post("/brand/insert", async (req, res) => {
  const [rows] = await db
    .promise()
    .query("SELECT brand_name FROM brand WHERE brand_name = ?", [
      req.body.brand_name,
    ]);

  if (rows.length === 0) {
    const sql =
      "insert into brand (brand_id,brand_name,brand_del) values (?,?,?)";
    const idnext = await getNextID("BRD", "brand");
    console.log(req.body.brand_name);
    db.query(sql, [idnext, req.body.brand_name, "0"], (err, data) => {
      if (err) {
        res.status(500).json({ msg: err });
        return;
      }
      res.status(201).json({
        msg: "เพิ่มแบรนด์สำเร็จ",
      });
    });
  } else {
    res.status(409).json({
      msg: "มี แบรนด์ นี้อยู่ในระบบแล้ว",
    });
  }
});

app.put("/brand/edit/:id", async (req, res) => {
  const [rows] = await db
    .promise()
    .query("SELECT brand_name FROM brand WHERE brand_name = ?", [
      req.body.brand_name,
    ]);

  if (rows.length === 0) {
    const sql = `
  UPDATE brand 
  SET 
    brand_name = ?
  WHERE brand_id = ?;
`;

    const values = [req.body.brand_name];
    const id = req.params.id;
    console.log(id);
    db.query(sql, [...values, id], (err, result) => {
      if (err) {
        res.status(500).json({ msg: "Error updating brand" });
        return;
      }
      res.status(201).json({
        msg: "แก้ไขแบรนด์สำเร็จ",
      });
    });
  } else {
    res.status(409).json({
      msg: "มี แบรนด์ นี้อยู่ในระบบแล้ว",
    });
  }
});

app.get("/getbrand/:id", (req, res) => {
  const id = req.params.id;
  if (id == "all") {
    const sql = "select brand_id, brand_name from brand";
    db.query(sql, (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  } else {
    const sql = "select brand_name from brand where brand_id =?";
    db.query(sql, [id], (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  }
});

app.delete("/brand/delete/:id", (req, res) => {
  console.log("brand delete");
  const sql = `
    UPDATE brand 
    SET 
      brand_del = ?
    WHERE brand_id = ?;
  `;
  const id = req.params.id;
  const values = ["1", id];
  db.execute(sql, values, (err, result) => {
    if (err) {
      console.error("Error delete employee:", err);
      res.status(500).json({
        msg: "Error delete brand",
      });
      return;
    }
    console.log("Employee delete successfully");
    res.status(201).json({
      msg: "ลบแบรนด์เรียบร้อยแล้ว",
      data: result,
    });
    return;
  });
});

app.get("/type", function (req, res) {
  let fetch = "select type_id,type_name,type_category from type";
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
  fetch += " Where type_del ='0' ";
  if (search) {
    fetch += "and type_name LIKE ? ";
    fetchValue.push("%" + search + "%");
  }
  fetch += " limit ?, ?";
  fetchValue.push(idx_start);
  fetchValue.push(per_page);
  db.execute(fetch, fetchValue, (err, result, field) => {
    if (!err) {
      db.query(
        "select count(type_id) as total from type where type_del='0'",
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

app.post("/type/insert", async (req, res) => {
  const [rows] = await db
    .promise()
    .query("SELECT type_id FROM type WHERE type_name = ? and type_category=?", [
      req.body.type_name,
      req.body.type_category,
    ]);

  if (rows.length === 0) {
    const sql =
      "insert into type (type_id,type_name,type_category,type_del) values (?,?,?,?)";
    const idnext = await getNextID("TYP", "type");
    console.log(req.body.type_name, req.body.type_category);
    db.query(
      sql,
      [idnext, req.body.type_name, req.body.type_category, "0"],
      (err, data) => {
        if (err) {
          res.status(500).json({ msg: err });
          return;
        }
        res.status(201).json({
          msg: "เพิ่มประเภทสำเร็จ",
        });
      }
    );
  } else {
    res.status(409).json({
      msg: "มี ประเภท นี้อยู่ในระบบแล้ว",
    });
  }
});

app.get("/gettype/:id", (req, res) => {
  const id = req.params.id;
  if (id == "all") {
    const sql = "select type_id, type_name ,type_category from type";
    db.query(sql, (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  } else {
    const sql = "select type_name ,type_category from type where type_id =?";
    db.query(sql, [id], (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  }
});

app.put("/type/edit/:id", async (req, res) => {
  const [rows] = await db
    .promise()
    .query(
      "SELECT type_id FROM type WHERE type_name = ? and type_category =?",
      [req.body.type_name, req.body.type_category]
    );

  if (rows.length === 0) {
    const sql = `
  UPDATE type 
  SET 
    type_name = ? ,
    type_category = ?
  WHERE type_id = ?;
`;

    const values = [req.body.type_name, req.body.type_category];
    const id = req.params.id;
    console.log(id);
    console.log(values);
    db.query(sql, [...values, id], (err, result) => {
      if (err) {
        res.status(500).json({ msg: "Error updating type" });
        return;
      }
      res.status(201).json({
        msg: "แก้ไขประเภทสำเร็จ",
      });
    });
  } else {
    res.status(409).json({
      msg: "มี ประเภท นี้อยู่ในระบบแล้ว",
    });
  }
});

app.delete("/type/delete/:id", (req, res) => {
  console.log("type delete");
  const sql = `
    UPDATE type 
    SET 
      type_del = ?
    WHERE type_id = ?;
  `;
  const id = req.params.id;
  const values = ["1", id];
  db.execute(sql, values, (err, result) => {
    if (err) {
      console.error("Error delete type:", err);
      res.status(500).json({
        msg: "Error delete type",
      });
      return;
    }
    console.log(" delete successfully");
    res.status(201).json({
      msg: "ลบประเภทเรียบร้อยแล้ว",
      data: result,
    });
    return;
  });
});

app.get("/position", function (req, res) {
  let fetch =
    "select posit_id,posit_name,dep_name from posit JOIN dep ON posit.dep_id=dep.dep_id";
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
  fetch += " Where posit_del ='0' ";
  if (search) {
    fetch += "and posit_name LIKE ? ";
    fetchValue.push("%" + search + "%");
  }
  fetch += " limit ?, ?";
  fetchValue.push(idx_start);
  fetchValue.push(per_page);
  db.execute(fetch, fetchValue, (err, result, field) => {
    if (!err) {
      db.query(
        "select count(posit_id) as total from posit where posit_del='0'",
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

app.post("/position/insert", async (req, res) => {
  const [rows] = await db
    .promise()
    .query("SELECT posit_id FROM posit WHERE posit_name = ? and dep_id =?", [
      req.body.posit_name,
      req.body.dep_id,
    ]);
  if (rows.length === 0) {
    const sql =
      "insert into posit (posit_id,posit_name,posit_permission,dep_id,posit_del) values (?,?,?,?,?)";
    const idnext = await getNextID("POS", "posit");
    db.query(
      sql,
      [idnext, req.body.posit_name, req.body.permission, req.body.dep_id, "0"],
      (err, data) => {
        if (err) {
          res.status(500).json({ msg: "insert ผิด" });
          return;
        }
        res.status(201).json({
          msg: "เพิ่มตำแหน่งสำเร็จ",
        });
      }
    );
  } else {
    res.status(409).json({
      msg: "มี ตำแหน่ง นี้อยู่ในระบบแล้ว",
    });
  }
});

//ดึงข้องมูล posit ไปแก้ไข
app.get("/getposit/:id", (req, res) => {
  const id = req.params.id;
  const sql =
    "select posit_name ,posit_permission,dep_id from posit where posit_id =?";
  db.query(sql, [id], (err, data) => {
    if (err) {
      return res.json(err);
    }
    return res.json(data);
  });
});

app.put("/position/edit/:id", async (req, res) => {
  const [rows] = await db
    .promise()
    .query("SELECT posit_name FROM posit WHERE posit_name = ? and dep_id =?", [
      req.body.posit_name,
      req.body.dep_id,
    ]);

  if (rows.length === 0) {
    const sql = `
    UPDATE posit 
    SET 
      posit_name = ?,
      posit_permission = ?,
      dep_id = ?
    WHERE posit_id = ?;
  `;

    const values = [req.body.posit_name, req.body.permission, req.body.dep_id];
    const id = req.params.id;
    console.log(id);
    db.execute(sql, [...values, id], (err, result) => {
      if (err) {
        res.status(500).json({ msg: "Error updating department" });
        return;
      }
      res.status(201).json({
        msg: "แก้ไขตำแหน่งสำเร็จ",
        data: result,
      });
      return;
    });
  } else {
    res.status(409).json({
      msg: "มี ตำแหน่ง นี้อยู่ในระบบแล้ว",
    });
  }
});

app.delete("/position/delete/:id", (req, res) => {
  console.log("posit delete");
  const sql = `
    UPDATE posit 
    SET 
      posit_del = ?
    WHERE posit_id = ?;
  `;
  const id = req.params.id;
  const values = ["1", id];
  db.execute(sql, values, (err, result) => {
    if (err) {
      res.status(500).json({
        msg: "Error delete position" + err,
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

// app.get("/customer", function (req, res) {
//   let fetch =
//     "select customer.customer_id,concat(customer_fname,' ',customer_lname) as customer_name,tel,customer_email,customer_type from customer LEFT JOIN customer_tel ON customer.customer_id=customer_tel.customer_id";
//   let fetchValue = [];
//   const page = parseInt(req.query.page);
//   const per_page = parseInt(req.query.per_page);
//   const sort_by = req.query.sort_by;
//   const sort_type = req.query.sort_type;
//   const search = req.query.search;
//   const idx_start = (page - 1) * per_page;

//   if (sort_by && sort_type) {
//     fetch += " ORDER BY " + sort_by + " " + sort_type;
//   }
//   fetch += " Where customer_del ='0' ";
//   if (search) {
//     fetch += "and customer_name LIKE ? ";
//     fetchValue.push("%" + search + "%");
//   }
//   fetch += " limit ?, ?";
//   fetchValue.push(idx_start);
//   fetchValue.push(per_page);
//   db.execute(fetch, fetchValue, (err, result, field) => {
//     if (!err) {
//       db.query(
//         "select count(customer_id) as total from customer where customer_del='0'",
//         (err, totalrs) => {
//           if (!err) {
//             const total = totalrs[0].total;
//             res.json({
//               data: result,
//               page: page,
//               per_page: per_page,
//               total: total,
//               total_pages: Math.ceil(total / per_page),
//             });
//           } else {
//             res.json({ msg: "query น่าจะผิด" });
//           }
//         }
//       );
//     } else {
//       res.json({ msg: err });
//     }
//   });
// });

app.get("/customer", function (req, res) {
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

app.post("/customer/insert", async (req, res) => {
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

app.get("/getcustomer/:id", (req, res) => {
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
        console.log(data[0].subdistrict_code);
        res.json({
          data: data,
          zip_code: zip_code,
        });
      });
    }
  });
});

app.put("/customer/edit/:id", async (req, res) => {
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

app.delete("/customer/delete/:id", (req, res) => {
  console.log("customer delete");
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
app.get("/employee", function (req, res, next) {
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

app.post("/employee/insert", uploadAvatar.single("img"), async (req, res) => {
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
    console.log(`
      commit: ${commit}
      salary: ${salary}
      Email: ${email}
      Password: ${password}
      First Name: ${fname}
      Last Name: ${lname}
      Birth Date: ${bdate}
      Hire Date: ${hiredate}
      Line: ${line}
      Sex: ${sex}
      Username: ${username}
      NID: ${nid}
      Address: ${address}
      phone: ${phone}
      Image: ${imageName}
    `);

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
});

app.get("/getemployee/:id", (req, res) => {
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

app.get("/getempselectposit/:id", (req, res) => {
  const id = req.params.id;
  const sql = "select posit_id,posit_name from posit where dep_id =?";
  db.query(sql, [id], (err, data) => {
    if (err) {
      return res.json(err);
    }
    return res.json(data);
  });
});

app.put("/employee/edit/:id", uploadAvatar.single("img"), async (req, res) => {
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

  // ตรวจสอบว่ามีลูกค้าที่มีข้อมูลเดียวกันหรือไม่
  const [rows] = await db
    .promise()
    .query(
      "SELECT employee_id FROM employee WHERE employee_fname = ? and employee_lname = ? and employee_nid = ? or employee_username=?",
      [fname, lname, nid, username]
    );
  if (rows.length > 1) {
    return res
      .status(409)
      .json({ msg: "มีพนักที่มีข้อมูล หรือ username ซ้ำกันอยู่ในระบบแล้ว" });
  }

  let sql = `
  UPDATE employee 
  SET 
  employee_salary = ?,
  employee_commit = ?,
  employee_id = ?, 
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
    employeeId,
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
      return res.status(500).json({ msg: "insert ผิด" });
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
          return res
            .status(201)
            .json({ msg: "แก้ไขข้อมูลพนักงานเรียบร้อยแล้ว" });
        }
      }
    );
  });
});

app.delete("/employeephone/delete/:id/:tel", (req, res) => {
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

app.delete("/employee/delete/:id", (req, res) => {
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

app.get("/product", function (req, res) {
  let fetch =
    "select product_id,product_name,product_price,product_amount,product_reorder from product ";
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
  fetch += " Where product_del ='0' ";
  if (search) {
    fetch += "and product_name LIKE ? ";
    fetchValue.push("%" + search + "%");
  }
  fetch += " limit ?, ?";
  fetchValue.push(idx_start);
  fetchValue.push(per_page);
  db.execute(fetch, fetchValue, (err, result, field) => {
    if (!err) {
      db.query(
        "select count(product_id) as total from product where product_del='0'",
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

app.post("/product/insert", uploadProduct.single("img"), async (req, res) => {
  const [rows] = await db
    .promise()
    .query(
      "SELECT product_id FROM product WHERE product_name = ? and brand_id = ? ",
      [req.body.product_name, req.body.brand_id]
    );
  if (rows.length === 0) {
    const sql = `insert into product (product_id,product_name,product_price,product_amount,product_reorder,product_detail,product_img,unit_m_id,unit_id,brand_id,type_id,product_del) values (?,?,?,?,?,?,?,?,?,?,?,?)`;
    const idnext = await getNextID("PRO", "product");
    const imageName = req.file.filename;
    db.query(
      sql,
      [
        idnext,
        req.body.product_name,
        req.body.product_price,
        req.body.product_amount,
        req.body.product_reorder,
        req.body.product_detail,
        imageName,
        req.body.unit_m_id,
        req.body.unit_id,
        req.body.brand_id,
        req.body.type_id,
        "0",
      ],
      (err, data) => {
        if (err) {
          res.status(500).json({ msg: "insert ผิด" });
          console.log(err);
          return;
        }
        res.status(201).json({
          msg: "เพิ่มสินค้าสำเร็จ",
        });
      }
    );
  } else {
    res.status(409).json({
      msg: "มี สินค้า นี้อยู่ในระบบแล้ว",
    });
  }
});

//ดึงข้องมูล product ไปแก้ไข
app.get("/getproduct/:id", (req, res) => {
  const id = req.params.id;
  if (id === "all") {
    const sql = `SELECT product_id, product_name, product_price, product_img , product_amount, unit_name
    FROM product
    JOIN unit u ON product.unit_id = u.unit_id;`;
    db.query(sql, [id], (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  } else {
    const sql = `SELECT product_id, product_name, product_price, product_amount, product_reorder, product_detail, product_img, unit_m_id, unit_id, brand_id, type_id
  FROM product
  WHERE product_id =? ;`;
    db.query(sql, [id], (err, data) => {
      if (err) {
        return res.json(err);
      }
      return res.json(data);
    });
  }
});

app.put("/product/edit/:id", uploadProduct.single("img"), async (req, res) => {
  const [rows] = await db
    .promise()
    .query(
      "SELECT product_id FROM product WHERE product_name = ? and brand_id =?",
      [req.body.product_name, req.body.brand_id]
    );

  if (rows.length === 0) {
    let sql = `
    UPDATE product 
    SET 
      product_name = ?,
      product_price= ?,
      product_amount= ?,
      product_reorder= ?,
      product_detail= ?,
      unit_m_id= ?,
      unit_id= ?,
      brand_id= ?,
      type_id= ?
  `;
    const imageName = req.file ? req.file.filename : "";
    let values = [
      req.body.product_name,
      req.body.product_price,
      req.body.product_amount,
      req.body.product_reorder,
      req.body.product_detail,
      req.body.unit_m_id,
      req.body.unit_id,
      req.body.brand_id,
      req.body.type_id,
    ];
    if (imageName.length > 0) {
      sql += ", product_img = ?";
      values.push(imageName);
    }
    sql += " WHERE product_id = ?;";
    values.push(req.params.id);

    db.execute(sql, values, (err, result) => {
      if (err) {
        res.status(500).json({ msg: "Error updating สินค้า" });
        return;
      }
      res.status(201).json({
        msg: "แก้ไขสินค้าสำเร็จ",
        data: result,
      });
      return;
    });
  } else {
    res.status(409).json({
      msg: "มี สินค้า นี้อยู่ในระบบแล้ว",
    });
  }
});

app.delete("/product/delete/:id", (req, res) => {
  console.log("product delete");
  const sql = `
    UPDATE product 
    SET 
      product_del = ?
    WHERE product_id = ?;
  `;
  const id = req.params.id;
  const values = ["1", id];
  db.execute(sql, values, (err, result) => {
    if (err) {
      res.status(500).json({
        msg: "Error delete product" + err,
      });
      return;
    }
    res.status(201).json({
      msg: "ลบสินค้าเรียบร้อยแล้ว",
      data: result,
    });
    return;
  });
});

app.get("/stock", function (req, res) {
  let fetch =
    "SELECT lot.lot_number, lot.lot_price, lot.lot_amount, lot.lot_total, lot.lot_date, lot_exp.lot_exp_date FROM lot LEFT JOIN lot_exp ON lot.lot_number = lot_exp.lot_number where lot.product_id=?";
  const id = req.query.id;
  let fetchValue = [id];

  const page = parseInt(req.query.page);
  const per_page = parseInt(req.query.per_page);
  const sort_by = req.query.sort_by;
  const sort_type = req.query.sort_type;
  const search = req.query.search;
  const idx_start = (page - 1) * per_page;

  console.log(id);
  if (sort_by && sort_type) {
    fetch += " ORDER BY " + sort_by + " " + sort_type;
  }
  if (search) {
    fetch += "and product_id LIKE ? ";
    fetchValue.push("%" + search + "%");
  }
  fetch += " limit ?, ?";
  fetchValue.push(idx_start);
  fetchValue.push(per_page);
  db.execute(fetch, fetchValue, (err, result, field) => {
    if (!err) {
      db.query(
        "select count(product_id) as total from lot where product_id = ?",
        id,
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
app.get("/selectstock/:id", function (req, res) {
  const id = req.params.id;
  let fetch = "SELECT lot_number, lot_amount FROM lot WHERE product_id= ?";

  let fetchValue = [id];
  console.log(fetchValue);
  db.execute(fetch, fetchValue, (err, result, field) => {
    if (!err) {
      res.json(result);
    } else {
      res.json({ msg: "query น่าจะผิด" });
    }
  });
});

app.post("/stock/insert", async (req, res) => {
  const next = await db
    .promise()
    .query(
      `select LPAD(IFNULL(Max(SUBSTR(lot_number, 13, 4)),0)+1,4,'0') as next from lot where product_id =?;`,
      [req.body.product_id]
    );
  const idnext =
    "LOT" + moment(Date.now()).format("YYYYMMDD") + "-" + next[0][0].next;
  console.log(idnext);
  const sql = `insert into lot (product_id,lot_number,lot_price,lot_amount,lot_total,lot_date,lot_has_exp) values (?,?,?,?,?,?,?)`;
  db.query(
    sql,
    [
      req.body.product_id,
      idnext,
      req.body.lot_price,
      req.body.lot_amount,
      req.body.lot_total,
      req.body.lot_date,
      req.body.lot_has_exp,
    ],
    (err, data) => {
      if (err) {
        res.status(500).json({ msg: "insert ผิด" });
        console.log(err);
        return;
      }
      res.status(201).json({
        msg: "เพิ่มสินค้าสำเร็จ",
      });
    }
  );
});

app.get("/quotation", function (req, res) {
  let fetch =
    "SELECT q.quotation_id, q.quotation_date, e.employee_fname, q.quotation_total FROM quotation q JOIN employee e ON q.employee_id = e.employee_id ;";
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
  fetch += " Where quotation_del ='0' ";
  if (search) {
    fetch += "and quotation_name LIKE ? ";
    fetchValue.push("%" + search + "%");
  }
  fetch += " limit ?, ?";
  fetchValue.push(idx_start);
  fetchValue.push(per_page);
  db.execute(fetch, fetchValue, (err, result, field) => {
    if (!err) {
      db.query(
        "select count(quotation_id) as total from quotation where quotation_del='0'",
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

app.post("/quotation/insert", async (req, res) => {
  const sql = `insert into quotation (quotation_id,quotation_num,quotation_date,quotation_status,quotation_credit,quotation_total,quotation_del,quotation_detail,quotation_vat,quotation_tax,employee_id,customer_id,quotation_dateend) values (?,?,?,?,?,?,?,?,?,?,?,?,?)`;
  const next = await db
    .promise()
    .query(
      `select LPAD(IFNULL(Max(SUBSTR(quotation_id, 12, 5)),0)+1,5,'0') as next from quotation ;`
    );
  const idnext =
    "QT" + moment(Date.now()).format("YYYYMMDD") + "-" + next[0][0].next;
  db.query(
    sql,
    [
      idnext,
      1,
      req.body.quotation_date,
      "รอดำเนินการ",
      req.body.quotation_credit,
      req.body.quotation_total,
      "0",
      req.body.quotation_detail,
      req.body.quotation_vat,
      req.body.quotation_tax,
      req.body.employee_id,
      req.body.customer_id,
      req.body.quotation_dateend,
    ],
    (err, data) => {
      if (err) {
        return res.status(500).json({ msg: "insert ผิด" });
      }
      if (req.body.listq && req.body.listq.length > 0) {
        req.body.listq.forEach((item, index) => {
          db.query(
            `insert into listq (listq_number,listq_price,listq_amount,listq_total,product_id,lot_number,quotation_id,quotation_num) values (?,?,?,?,?,?,?,?)`,
            [
              index,
              item.listq_price,
              item.listq_amount,
              item.listq_total,
              item.product_id,
              item.lot_number,
              idnext,
              1,
            ],
            (err) => {
              if (err) {
                return res.status(500).json({
                  msg: "เกิดข้อผิดพลาดในการเพิ่มรายการสินค้า",
                });
              }
            }
          );
        });
      }
      res.status(201).json({
        msg: "เพิ่มใบเสนอราคาแล้ว",
      });
    }
  );
});

app.get("/getcustomers", function (req, res) {
  const sql = `select customer_id, CONCAT(customer_fname,' ',customer_lname) AS customer_name FROM customer WHERE customer_del = '0';
  `;
  db.query(sql, (err, data) => {
    if (err) {
      return res.json(err);
    }
    return res.json(data);
  });
});

app.get("/getprovince", (req, res) => {
  const sql = "select code,name from provinces";
  db.query(sql, (err, data) => {
    if (err) {
      return res.json(err);
    }
    return res.json(data);
  });
});

app.get("/getdistrict/:id", (req, res) => {
  const sql = "select code,name from district where province_code = ?;";
  db.query(sql, req.params.id, (err, data) => {
    if (err) {
      return res.json(err);
    }
    return res.json(data);
  });
});

app.get("/getsubdistrict/:id", (req, res) => {
  const sql =
    "select code,name,zip_code from subdistrict where district_code = ?;";
  db.query(sql, req.params.id, (err, data) => {
    if (err) {
      return res.json(err);
    }
    return res.json(data);
  });
});

app.get("/img/avatar/:imageName", (req, res) => {
  const imageName = req.params.imageName;
  const imagePath = path.join(__dirname, "img", "avatar", imageName);

  // ส่งไฟล์ภาพกลับไปให้กับผู้ใช้
  res.sendFile(imagePath);
});
app.get("/img/product/:imageName", (req, res) => {
  const imageName = req.params.imageName;
  const imagePath = path.join(__dirname, "img", "product", imageName);

  // ส่งไฟล์ภาพกลับไปให้กับผู้ใช้
  res.sendFile(imagePath);
});
app.listen(process.env.PORT, () => {
  console.log("Hello World this from Server");
});
