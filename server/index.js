const express = require("express");
const app = express();
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const saltRounds = 10;
const uuid = require("uuid");
const moment = require("moment");
const jwt = require("jsonwebtoken");
const http = require("http");
const socketIo = require("socket.io");
const PDFDocument = require("pdfkit");
const fs = require("fs");
require("dotenv").config();

const corsOptions = {
  origin: "http://localhost:5173", // เปลี่ยนเป็นพอร์ตที่ React ใช้ทำงาน
  methods: ["GET", "POST", "PUT", "DELETE"],
};
// ตั้งค่ามิดเดิลแวร์
app.use(express.json());
app.use(cors(corsOptions));

// สร้างเซิร์ฟเวอร์ HTTP
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173", // เปลี่ยนเป็นพอร์ตที่ React ใช้ทำงาน
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// ตั้งค่าการเชื่อมต่อฐานข้อมูล MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "hubwater",
  timezone: "Z",
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
  } else {
    console.log("Connected to MySQL database");
  }
});

// สร้าง pool สำหรับการเชื่อมต่อฐานข้อมูล MySQL
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "hubwater",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// เมื่อมี client เชื่อมต่อกับ socket จะมีการ log show
io.on("connection", (socket) => {
  console.log("A user connected");
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// เริ่มเซิร์ฟเวอร์
const PORT = process.env.PORT || 4000;

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

const storageExpense = multer.diskStorage({
  destination: path.join(__dirname, "img", "expense"),
  filename: function (req, file, cb) {
    // null as first argument means no error
    cb(null, Date.now() + "-" + uuid.v4().substring(0, 8) + ".png");
  },
});

const uploadAvatar = multer({ storage: storageAvatar });
const uploadProduct = multer({ storage: storageProduct });
const uploadExpense = multer({ storage: storageExpense });

const updateStatus = (id, status, res) => {
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
  console.log(sql);
  db.query(sql, [status, id], (err, result) => {
    if (err) {
      return res.status(500).send("Database update failed.");
    }
    // ส่งข้อความไปยัง client ที่เชื่อมต่อทั้งหมด
    io.emit("statusUpdate", { status, id });
  });
};

app.put("/updateStatus", (req, res) => {
  let { status, id } = req.body;
  // Uncomment and adjust the following if necessary
  // if (status === "สร้างใบวางบิล" || status === "สร้างใบแจ้งหนี้") {
  //   status = "ดำเนินการแล้ว";
  // }

  updateStatus(id, status, res);
});

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
      console.log(next[0][0], " ไอดีของ พนักงานต่อไป");
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
    const sql = "select bank_id, bank_name ,bank_type , bank_num from bank";
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
    // console.log(`
    //   commit: ${commit}
    //   salary: ${salary}
    //   Email: ${email}
    //   Password: ${password}
    //   First Name: ${fname}
    //   Last Name: ${lname}
    //   Birth Date: ${bdate}
    //   Hire Date: ${hiredate}
    //   Line: ${line}
    //   Sex: ${sex}
    //   Username: ${username}
    //   NID: ${nid}
    //   Address: ${address}
    //   phone: ${phone}
    //   Image: ${imageName}
    // `);
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
      return res
        .status(409)
        .json({ msg: "มีพนักที่มีข้อมูล หรือ username ซ้ำกันอยู่ในระบบแล้ว" });
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
    let sql = `SELECT product_id, product_name, product_price, product_img, product_amount, unit_name
                 FROM product
                 JOIN unit  ON product.unit_id = unit.unit_id WHERE product_name LIKE ?`;
    const search = "%" + req.query.search + "%";

    db.query(sql, search, (err, data) => {
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
  db.execute(fetch, fetchValue, (err, result) => {
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
  let fetch =
    "SELECT lot_number, lot_amount ,lot_price ,lot_date FROM lot WHERE product_id= ? and lot_amount > 0";
  let fetchValue = [id];
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
  console.log(idnext, " ไอดีของ lot ");
  const sql = `insert into lot (product_id,lot_number,lot_price,lot_amount,lot_total,lot_date) values (?,?,?,?,?,?)`;
  db.query(
    sql,
    [
      req.body.product_id,
      idnext,
      req.body.lot_price,
      req.body.lot_amount,
      req.body.lot_amount,
      req.body.lot_date,
    ],
    (err) => {
      if (err) {
        res.status(500).json({ msg: "insert ผิด" + err });
        console.log(err);
        return;
      }
    }
  );
  if (req.body.lot_exp) {
    db.query(
      `insert into lot_exp (product_id,lot_number,lot_exp_date) values (?,?,?)`,
      [req.body.product_id, idnext, req.body.lot_exp],
      (err) => {
        if (err) {
          res.status(500).json({ msg: "insert ผิด" + err });
          console.log(err);
          return;
        }
      }
    );
  }
  db.query(
    `UPDATE product
     SET product_amount = product_amount + ?
     WHERE product_id = ?;`,
    [req.body.lot_amount, req.body.product_id],
    (err) => {
      if (err) {
        res.status(404).json({
          msg: "insert ผิด" + err,
        });
      } else {
        res.status(201).json({
          msg: "เพิ่มสินค้าสำเร็จ",
        });
      }
    }
  );
});
app.put("/stock/edit/:id", async (req, res) => {
  const product_id = req.params.id;

  if (req.body.lot_amountNew) {
    req.body.lot_amount += req.body.lot_amountNew;
    console.log(req.body.lot_amount);
  }

  const updateLot = `
    UPDATE lot
    SET lot_price = ?, lot_amount = ?, lot_total = ?, lot_date = ?
    WHERE product_id = ? AND lot_number = ?;
  `;

  try {
    await db
      .promise()
      .query(updateLot, [
        req.body.lot_price,
        req.body.lot_amount,
        req.body.lot_total,
        req.body.lot_date,
        product_id,
        req.body.lot_number,
      ]);

    if (req.body.lot_exp_date) {
      const checkLotExp = `
          SELECT 1 FROM lot_exp
          WHERE product_id = ? AND lot_number = ?;
        `;
      const [rows] = await db
        .promise()
        .query(checkLotExp, [product_id, req.body.lot_number]);

      if (rows.length > 0) {
        const updateLotExp = `
            UPDATE lot_exp
            SET lot_exp_date = ?
            WHERE product_id = ? AND lot_number = ?;
          `;
        await db
          .promise()
          .query(updateLotExp, [
            req.body.lot_exp_date,
            product_id,
            req.body.lot_number,
          ]);
      } else {
        const insertLotExp = `
            INSERT INTO lot_exp (product_id, lot_number, lot_exp_date)
            VALUES (?, ?, ?);
          `;
        await db
          .promise()
          .query(insertLotExp, [
            product_id,
            req.body.lot_number,
            req.body.lot_exp_date,
          ]);
      }
    }

    if (req.body.lot_amountNew) {
      const updateProductAmount = `
        UPDATE product
        SET product_amount = product_amount + ?
        WHERE product_id = ?;
      `;
      await db
        .promise()
        .query(updateProductAmount, [req.body.lot_amountNew, product_id]);
    }

    res.status(201).json({
      msg: "เพิ่มสินค้าสำเร็จ",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      msg: "insert ผิด " + err,
    });
  }
});

app.get("/quotation", function (req, res) {
  let fetch =
    "SELECT q.quotation_id, q.quotation_date, c.customer_fname,e.employee_fname, q.quotation_total, q.quotation_status FROM quotation q JOIN employee e ON q.employee_id = e.employee_id JOIN customer c ON c.customer_id = q.customer_id WHERE q.quotation_del = '0'";
  let fetchValue = [];
  const page = parseInt(req.query.page);
  const per_page = parseInt(req.query.per_page);
  const sort_by = req.query.sort_by;
  const sort_type = req.query.sort_type;
  const search = req.query.search;
  const idx_start = (page - 1) * per_page;

  if (search) {
    fetch += ` AND (
      q.quotation_id LIKE ?
      OR c.customer_fname LIKE ?
      OR q.quotation_date LIKE ?
    )`;
    fetchValue = Array(3).fill(`${search}%`);
  }

  if (sort_by && sort_type) {
    fetch += " ORDER BY " + sort_by + " " + sort_type;
  }

  fetch += " LIMIT ?, ?";
  fetchValue.push(idx_start);
  fetchValue.push(per_page);

  db.execute(fetch, fetchValue, (err, result, field) => {
    if (!err) {
      db.query(
        "SELECT COUNT(quotation_id) AS total FROM quotation WHERE quotation_del='0'",
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
  console.log(req.body.quotation_date);
  const idnext =
    "QT" +
    moment(req.body.quotation_date).format("YYYYMMDD") +
    "-" +
    next[0][0].next;
  db.query(
    sql,
    [
      idnext,
      1,
      req.body.quotation_date,
      "รออนุมัติ",
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
    (err) => {
      if (err) {
        console.log(err);
        return res
          .status(500)
          .json({ msg: "insert ข้อมูลใบเสนอราคาผิด ไม่เกี่ยวกับรายการ" });
      }
      if (req.body.items && req.body.items.length > 0) {
        let success = true; // ตั้งค่าเริ่มต้นเป็น true
        req.body.items.forEach((item, index) => {
          console.log(item);
          db.query(
            `insert into listq (listq_number,listq_price,listq_amount,listq_total,product_id,lot_number,quotation_id,quotation_num) values (?,?,?,?,?,?,?,?)`,
            [
              item.listq_number,
              item.product_price,
              item.listq_amount,
              item.listq_total,
              item.product_id,
              item.lot_number,
              idnext,
              1,
            ],
            (err) => {
              if (err) {
                console.log(err);
                success = false; // ถ้าเกิดข้อผิดพลาดในการเพิ่มรายการสินค้า เปลี่ยนเป็น false
              }
              // ให้ส่งการตอบกลับไปยังไคลเอนต์เมื่อวนลูปเสร็จสิ้น
              if (index === req.body.items.length - 1) {
                if (success) {
                  res.status(201).json({
                    msg: "เพิ่มใบเสนอราคาแล้ว",
                  });
                } else {
                  res.status(500).json({
                    msg: "เกิดข้อผิดพลาดในการเพิ่มรายการสินค้า",
                  });
                }
              }
            }
          );
        });
      } else {
        res.status(201).json({
          msg: "เพิ่มใบเสนอราคาแล้ว",
        });
      }
    }
  );
});

app.get("/getquotation/:id", function (req, res) {
  const quotationId = req.params.id;
  const sqlQuotation = `SELECT quotation_num, quotation_date, quotation_total, quotation_credit, quotation_detail, quotation_vat, quotation_tax, quotation_status, employee_id, customer_id FROM quotation WHERE quotation_id = ?;`;
  db.query(sqlQuotation, [quotationId], (err, quotationDetail) => {
    if (err) {
      console.log(err);
      return res.json(err);
    }

    const sqlListq = `SELECT listq_number, listq_price, listq_amount, listq_total, product_id, lot_number,  quotation_num FROM listq WHERE quotation_id = ?;`;
    db.query(sqlListq, [quotationId], (err, listqDetail) => {
      if (err) {
        console.log(err);
        return res.json(err);
      }

      const productIds = listqDetail.map((item) => item.product_id);

      // ตรวจสอบว่าอาร์เรย์ productIds ไม่ว่างเปล่า
      if (productIds.length === 0) {
        return res.json({
          quotationDetail: quotationDetail,
          listbDetail: listqDetail,
          productDetail: [],
          employee_name: "",
          message: "ไม่พบสินค้าสำหรับรหัสใบเสนอราคาที่กำหนด",
        });
      }
      const sqlProduct = `SELECT product_id, product_name, product_price, product_img, unit.unit_name FROM product join unit on product.unit_id = unit.unit_id WHERE product_id IN (?);`;

      db.query(sqlProduct, [productIds], (err, productDetail) => {
        if (err) {
          console.log(err);
          return res.json(err);
        }

        const sqlEmployee_name =
          'SELECT CONCAT(employee_fname, " ", employee_lname) as employee_name FROM employee WHERE employee_id = ?;';
        db.query(
          sqlEmployee_name,
          [quotationDetail[0].employee_id],
          (err, employee_nameResult) => {
            if (err) {
              console.log(err);
              return res.json(err);
            }

            const employee_name = employee_nameResult[0].employee_name;
            return res.json({
              quotationDetail: quotationDetail,
              listqDetail: listqDetail,
              productDetail: productDetail,
              employee_name: employee_name,
            });
          }
        );
      });
    });
  });
});

// app.put("/quotation/status", (req, res) => {
//   let { status, quotation_id } = req.body;
//   updateStatus(id, status, res, io);
// });

app.put("/quotation/edit/:id", async (req, res) => {
  const quotationId = req.params.id;

  const updateQuotationSql = `UPDATE quotation 
                              SET quotation_date = ?, quotation_credit = ?, quotation_total = ?, quotation_detail = ?, 
                                  quotation_vat = ?, quotation_tax = ?, employee_id = ?, customer_id = ?, quotation_dateend = ?
                              WHERE quotation_id = ?`;

  db.query(
    updateQuotationSql,
    [
      req.body.quotation_date,
      req.body.quotation_credit,
      req.body.quotation_total,
      req.body.quotation_detail,
      req.body.quotation_vat,
      req.body.quotation_tax,
      req.body.employee_id,
      req.body.customer_id,
      req.body.quotation_dateend,
      quotationId,
    ],
    async (err) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ msg: "Update ข้อมูลใบเสนอราคาผิดพลาด" });
      }

      const sqlListq = `SELECT listq_number, 
      product_id
                        FROM listq WHERE quotation_id = ?`;

      const [existingItems] = await db.promise().query(sqlListq, [quotationId]);

      const existingItemMap = new Map();
      existingItems.forEach((item) => {
        const key = `${item.product_id}-${item.listq_number}`;
        existingItemMap.set(key, item);
      });

      const newItemMap = new Map();
      req.body.items.forEach((item) => {
        const key = `${item.product_id}-${item.listq_number}`;
        newItemMap.set(key, item);
      });

      const toInsert = [];
      const toUpdate = [];
      const toDelete = [];

      newItemMap.forEach((item, key) => {
        if (existingItemMap.has(key)) {
          toUpdate.push(item);
          existingItemMap.delete(key);
        } else {
          toInsert.push(item);
        }
      });
      console.log(toUpdate);

      existingItemMap.forEach((item, key) => {
        toDelete.push(item);
      });

      const insertPromises = toInsert.map((item, index) => {
        return db.promise().query(
          `INSERT INTO listq (listq_number, listq_price, listq_amount, listq_total, product_id, lot_number, quotation_id, quotation_num)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.listq_number,
            item.product_price,
            item.listq_amount,
            item.listq_total,
            item.product_id,
            item.lot_number,
            quotationId,
            1,
          ]
        );
      });

      const updatePromises = toUpdate.map((item) => {
        return db.promise().query(
          `UPDATE listq SET listq_price = ?, listq_amount = ?, listq_total = ?, lot_number = ? 
           WHERE listq_number = ? AND quotation_id = ?`,
          [
            item.listq_price,
            item.listq_amount,
            item.listq_total,
            item.lot_number,
            item.listq_number,
            quotationId,
          ]
        );
      });

      const deletePromises = toDelete.map((item) => {
        return db
          .promise()
          .query(
            `DELETE FROM listq WHERE listq_number = ? AND quotation_id = ?`,
            [item.listq_number, quotationId]
          );
      });

      try {
        await Promise.all([
          ...insertPromises,
          ...updatePromises,
          ...deletePromises,
        ]);
        res
          .status(200)
          .json({ msg: "แก้ไขใบเสนอราคาและรายการสินค้าเรียบร้อยแล้ว" });
      } catch (err) {
        console.log(err);
        res
          .status(500)
          .json({ msg: "เกิดข้อผิดพลาดในการปรับปรุงรายการสินค้า" });
      }
    }
  );
});

// เหลือการ auth ก่อนการ delete
app.delete("/quotation/delete/:id", (req, res) => {
  const sql = `
    UPDATE quotation 
    SET 
      quotation_del = ?
    WHERE quotation_id = ?;
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
    res.status(201).json({
      msg: "ลบเรียบร้อยแล้ว",
      data: result,
    });
    return;
  });
});

app.get("/bill", function (req, res) {
  let fetch =
    "SELECT b.bn_id, b.bn_date, c.customer_fname,e.employee_fname, b.bn_total, b.bn_status,b.bn_type FROM bill b JOIN employee e ON b.employee_id = e.employee_id JOIN customer c ON c.customer_id = b.customer_id WHERE b.bn_del = '0'";
  let fetchValue = [];
  const page = parseInt(req.query.page);
  const per_page = parseInt(req.query.per_page);
  const sort_by = req.query.sort_by;
  const sort_type = req.query.sort_type;
  const search = req.query.search;
  const idx_start = (page - 1) * per_page;

  if (search) {
    fetch += ` AND (
      b.bn_id LIKE ?
      OR c.customer_fname LIKE ?
      OR b.bn_date LIKE ?
    )`;
    fetchValue = Array(3).fill(`${search}%`);
  }

  if (sort_by && sort_type) {
    fetch += " ORDER BY " + sort_by + " " + sort_type;
  }

  fetch += " LIMIT ?, ?";
  fetchValue.push(idx_start);
  fetchValue.push(per_page);

  db.execute(fetch, fetchValue, (err, result, field) => {
    if (!err) {
      db.query(
        "SELECT COUNT(bn_id) AS total FROM bill WHERE bn_del='0'",
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

app.post("/bill/insert", async (req, res) => {
  const sqlInsertBill = `INSERT INTO bill (bn_id, bn_date, bn_status, bn_credit, bn_total, bn_del, bn_detail, bn_vat, bn_tax, employee_id, customer_id, bn_type, bn_dateend) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`;
  const sqlSelectNext = `SELECT LPAD(IFNULL(MAX(SUBSTR(bn_id, 12, 5)),0)+1,5,'0') AS next FROM bill;`;
  const sqlInertQtBn = `INSERT INTO quotation_has_bill (bn_id, quotation_id, quotation_num ) VALUES (?,?,?)`;

  try {
    const connection = await pool.promise().getConnection();
    await connection.beginTransaction();

    try {
      const [next] = await connection.query(sqlSelectNext);

      const idnext =
        "BN" +
        moment(req.body.bill_date).format("YYYYMMDD") +
        "-" +
        next[0].next;

      await connection.query(sqlInsertBill, [
        idnext,
        req.body.bill_date,
        req.body.bill_status,
        req.body.bill_credit,
        req.body.bill_total,
        "0",
        req.body.bill_detail,
        req.body.bill_vat,
        req.body.bill_tax,
        req.body.employee_id,
        req.body.customer_id,
        "เดี่ยว",
        req.body.bill_dateend,
      ]);

      if (req.body.items && req.body.items.length > 0) {
        const itemPromises = req.body.items.map((item) =>
          connection.query(
            `INSERT INTO listb (listb_number, listb_price, listb_amount, listb_total, product_id, lot_number, bn_id) VALUES (?,?,?,?,?,?,?)`,
            [
              item.listb_number,
              item.product_price,
              item.listb_amount,
              item.listb_total,
              item.product_id,
              item.lot_number,
              idnext,
            ]
          )
        );

        await Promise.all(itemPromises);
      }
      //ต้องแก้ ใบที่ ของใบเสนอราคาด้วย ตอนนี้กำหนดเป็น 1 ไปก่อน
      if (req.body.quotation_id) {
        await connection.query(sqlInertQtBn, [
          idnext,
          req.body.quotation_id,
          1,
        ]);
        updateStatus(req.body.quotation_id, "ดำเนินการแล้ว", res);
      }

      await connection.commit();
      res.status(201).json({ msg: "เพิ่มใบแล้ว" });
    } catch (err) {
      console.error(err);
      await connection.rollback();
      res.status(500).json({ msg: "เกิดข้อผิดพลาดในการเพิ่มรายการสินค้า" });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล" });
  }
});

app.get("/getbill/:id", function (req, res) {
  const bnId = req.params.id;
  const sqlBill = `SELECT bn_date, bn_total, bn_credit, bn_detail, bn_vat, bn_tax, employee_id, customer_id ,bn_type,bn_dateend FROM bill WHERE bn_id = ?;`;

  db.query(sqlBill, [bnId], (err, bnDetail) => {
    if (err) {
      console.log(err);
      return res.json(err);
    }

    const sqlListq = `SELECT listb_number, listb_price, listb_amount, listb_total, product_id, lot_number FROM listb WHERE bn_id = ?;`;
    db.query(sqlListq, [bnId], (err, listbDetail) => {
      if (err) {
        console.log(err);
        return res.json(err);
      }

      console.log(listbDetail);
      const productIds = listbDetail.map((item) => item.product_id);

      // ตรวจสอบว่าอาร์เรย์ productIds ไม่ว่างเปล่า
      if (productIds.length === 0) {
        return res.json({
          bnDetail: bnDetail,
          listbDetail: listbDetail,
          productDetail: [],
          employee_name: "",
          message: "ไม่พบสินค้าสำหรับรหัสบิลที่กำหนด",
        });
      }

      const sqlProduct = `SELECT product_id, product_name, product_price, product_img, unit.unit_name FROM product JOIN unit ON product.unit_id = unit.unit_id WHERE product_id IN (?);`;
      db.query(sqlProduct, [productIds], (err, productDetail) => {
        if (err) {
          console.log(err);
          return res.json(err);
        }

        const sqlEmployee_name =
          'SELECT CONCAT(employee_fname, " ", employee_lname) AS employee_name FROM employee WHERE employee_id = ?;';
        db.query(
          sqlEmployee_name,
          [bnDetail[0].employee_id],
          (err, employee_nameResult) => {
            if (err) {
              console.log(err);
              return res.json(err);
            }

            const employee_name = employee_nameResult[0]
              ? employee_nameResult[0].employee_name
              : "";
            return res.json({
              bnDetail: bnDetail,
              listbDetail: listbDetail,
              productDetail: productDetail,
              employee_name: employee_name,
            });
          }
        );
      });
    });
  });
});

app.put("/bill/status", function (req, res) {
  const { status, bn_id } = req.body;
  const sql = "update bill set bn_status = ? where bn_id = ?";
  db.query(sql, [status, bn_id]);
});
app.put("/bill/edit/:id", async (req, res) => {
  const bnId = req.params.id;

  const updateBillSql = `UPDATE bill 
                              SET bn_date = ?, bn_credit = ?, bn_total = ?, bn_detail = ?, 
                                  bn_vat = ?, bn_tax = ?, employee_id = ?, customer_id = ?,bn_type =?, bn_dateend = ?
                              WHERE bn_id = ?`;

  db.query(
    updateBillSql,
    [
      req.body.bn_date,
      req.body.bn_credit,
      req.body.bn_total,
      req.body.bn_detail,
      req.body.bn_vat,
      req.body.bn_tax,
      req.body.employee_id,
      req.body.customer_id,
      "เดี่ยว",
      req.body.bn_dateend,
      bnId,
    ],
    async (err) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ msg: "Update ข้อมูลใบผิดพลาด" });
      }

      const sqlListb = `SELECT listb_number, product_id
                        FROM listb WHERE bn_id = ?`;

      const [existingItems] = await db.promise().query(sqlListb, [bnId]);

      const existingItemMap = new Map();
      existingItems.forEach((item) => {
        const key = `${item.product_id}-${item.listb_number}`;
        existingItemMap.set(key, item);
      });

      const newItemMap = new Map();
      req.body.items.forEach((item) => {
        const key = `${item.product_id}-${item.listb_number}`;
        newItemMap.set(key, item);
      });
      const toInsert = [];
      const toUpdate = [];
      const toDelete = [];

      newItemMap.forEach((item, key) => {
        if (existingItemMap.has(key)) {
          toUpdate.push(item);
          existingItemMap.delete(key);
        } else {
          toInsert.push(item);
        }
      });

      existingItemMap.forEach((item, key) => {
        toDelete.push(item);
      });
      console.log(existingItemMap);

      const insertPromises = toInsert.map((item, index) => {
        return db.promise().query(
          `INSERT INTO listb (listb_number, listb_price, listb_amount, listb_total, product_id, lot_number, bn_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            item.listb_number,
            item.product_price,
            item.listb_amount,
            item.listb_total,
            item.product_id,
            item.lot_number,
            bnId,
          ]
        );
      });

      const updatePromises = toUpdate.map((item) => {
        console.log(item);
        return db.promise().query(
          `UPDATE listb SET listb_price = ?, listb_amount = ?, listb_total = ?, lot_number = ? 
           WHERE  listb_number = ? AND bn_id = ?`,
          [
            item.product_price,
            item.listb_amount,
            item.listb_total,
            item.lot_number,
            item.listb_number,
            bnId,
          ]
        );
      });

      const deletePromises = toDelete.map((item) => {
        return db
          .promise()
          .query(`DELETE FROM listb WHERE listb_number = ? AND bn_id = ?`, [
            item.listb_number,
            bnId,
          ]);
      });

      try {
        await Promise.all([
          ...insertPromises,
          ...updatePromises,
          ...deletePromises,
        ]);
        res
          .status(200)
          .json({ msg: "แก้ไขใบเสนอราคาและรายการสินค้าเรียบร้อยแล้ว" });
      } catch (err) {
        console.log(err);
        res
          .status(500)
          .json({ msg: "เกิดข้อผิดพลาดในการปรับปรุงรายการสินค้า" });
      }
    }
  );
});

// เหลือการ auth ก่อนการ delete
app.delete("/bill/delete/:id", (req, res) => {
  const sql = `
    UPDATE bill 
    SET 
      bn_del = ?
    WHERE bn_id = ?;
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
    res.status(201).json({
      msg: "ลบเรียบร้อยแล้ว",
      data: result,
    });
    return;
  });
});

app.get("/invoice", function (req, res) {
  let fetch =
    "SELECT i.iv_id, i.iv_date, c.customer_fname,e.employee_fname, i.iv_total, i.iv_status FROM invoice i JOIN employee e ON i.employee_id = e.employee_id JOIN customer c ON c.customer_id = i.customer_id WHERE i.iv_del = '0'";
  let fetchValue = [];
  const page = parseInt(req.query.page);
  const per_page = parseInt(req.query.per_page);
  const sort_by = req.query.sort_by;
  const sort_type = req.query.sort_type;
  const search = req.query.search;
  const idx_start = (page - 1) * per_page;

  if (search) {
    fetch += ` AND (
      i.iv_id LIKE ?
      OR c.customer_fname LIKE ?
      OR i.iv_date LIKE ?
    )`;
    fetchValue = Array(3).fill(`${search}%`);
  }

  if (sort_by && sort_type) {
    fetch += " ORDER BY " + sort_by + " " + sort_type;
  }

  fetch += " LIMIT ?, ?";
  fetchValue.push(idx_start);
  fetchValue.push(per_page);

  db.execute(fetch, fetchValue, (err, result, field) => {
    if (!err) {
      db.query(
        "SELECT COUNT(iv_id) AS total FROM invoice WHERE iv_del='0'",
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

app.post("/invoice/insert", async (req, res) => {
  const sqlInsertInvoice = `insert into invoice (iv_id,iv_date,iv_status,iv_credit,iv_total,iv_del,iv_detail,iv_vat,iv_tax,employee_id,customer_id,iv_dateend) values (?,?,?,?,?,?,?,?,?,?,?,?)`;
  const sqlSelectNext = `select LPAD(IFNULL(Max(SUBSTR(iv_id, 12, 5)),0)+1,5,'0') as next from invoice ;`;
  const sqlInertQtIv = `INSERT INTO quotation_has_invoice (iv_id, quotation_id, quotation_num ) VALUES (?,?,?)`;
  const sqlInertBnIv = `INSERT INTO bill_has_invoice (iv_id, bn_id ) VALUES (?,?)`;

  try {
    const connection = await pool.promise().getConnection();
    await connection.beginTransaction();

    try {
      const [next] = await connection.query(sqlSelectNext);

      const idnext =
        "IV" +
        moment(req.body.invoice_date).format("YYYYMMDD") +
        "-" +
        next[0].next;
      await connection.query(sqlInsertInvoice, [
        idnext,
        req.body.invoice_date,
        req.body.invoice_status,
        req.body.invoice_credit,
        req.body.invoice_total,
        "0",
        req.body.invoice_detail,
        req.body.invoice_vat,
        req.body.invoice_tax,
        req.body.employee_id,
        req.body.customer_id,
        req.body.invoice_dateend,
      ]);
      if (req.body.items && req.body.items.length > 0) {
        const itemPromises = req.body.items.map((item) =>
          connection.query(
            `insert into listi (listi_number,listi_price,listi_amount,listi_total,product_id,lot_number,iv_id) values (?,?,?,?,?,?,?)`,
            [
              item.listi_number,
              item.product_price,
              item.listi_amount,
              item.listi_total,
              item.product_id,
              item.lot_number,
              idnext,
            ]
          )
        );
        await Promise.all(itemPromises);
      }
      //ต้องแก้ ใบที่ ของใบเสนอราคาด้วย ตอนนี้กำหนดเป็น 1 ไปก่อน
      if (req.body.quotation_id) {
        await connection.query(sqlInertQtIv, [
          idnext,
          req.body.quotation_id,
          1,
        ]);
        updateStatus(req.body.quotation_id, "ดำเนินการแล้ว", res);
      }
      if (req.body.bn_id) {
        await connection.query(sqlInertBnIv, [idnext, req.body.bn_id]);
        updateStatus(req.body.bn_id, "ดำเนินการแล้ว", res);
      }

      await connection.commit();
      res.status(201).json({ msg: "เพิ่มใบแล้ว" });
    } catch (err) {
      console.error(err);
      await connection.rollback();
      res.status(500).json({ msg: "เกิดข้อผิดพลาดในการเพิ่มรายการสินค้า" });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล" });
  }
});

app.get("/getinvoice/:id", function (req, res) {
  const ivId = req.params.id;
  const sqlInvoice = `SELECT iv_date, iv_total, iv_credit, iv_detail, iv_vat, iv_tax, employee_id, customer_id ,iv_dateend FROM invoice WHERE iv_id = ?;`;

  db.query(sqlInvoice, [ivId], (err, ivDetail) => {
    if (err) {
      console.log(err);
      return res.json(err);
    }

    const sqlListq = `SELECT listi_number, listi_price, listi_amount, listi_total, product_id, lot_number FROM listi WHERE iv_id = ?;`;
    db.query(sqlListq, [ivId], (err, listiDetail) => {
      if (err) {
        console.log(err);
        return res.json(err);
      }

      console.log(listiDetail);
      const productIds = listiDetail.map((item) => item.product_id);

      // ตรวจสอบว่าอาร์เรย์ productIds ไม่ว่างเปล่า
      if (productIds.length === 0) {
        return res.json({
          ivDetail: ivDetail,
          listiDetail: listiDetail,
          productDetail: [],
          employee_name: "",
          message: "ไม่พบสินค้าสำหรับรหัสบิลที่กำหนด",
        });
      }

      const sqlProduct = `SELECT product_id, product_name, product_price, product_img, unit.unit_name FROM product JOIN unit ON product.unit_id = unit.unit_id WHERE product_id IN (?);`;
      db.query(sqlProduct, [productIds], (err, productDetail) => {
        if (err) {
          console.log(err);
          return res.json(err);
        }

        const sqlEmployee_name =
          'SELECT CONCAT(employee_fname, " ", employee_lname) AS employee_name FROM employee WHERE employee_id = ?;';
        db.query(
          sqlEmployee_name,
          [ivDetail[0].employee_id],
          (err, employee_nameResult) => {
            if (err) {
              console.log(err);
              return res.json(err);
            }

            const employee_name = employee_nameResult[0]
              ? employee_nameResult[0].employee_name
              : "";
            return res.json({
              ivDetail: ivDetail,
              listiDetail: listiDetail,
              productDetail: productDetail,
              employee_name: employee_name,
            });
          }
        );
      });
    });
  });
});

app.put("/invoice/status", function (req, res) {
  const { status, iv_id } = req.body;
  const sql = "update invoice set iv_status = ? where iv_id = ?";
  db.query(sql, [status, iv_id]);
});
app.put("/invoice/edit/:id", async (req, res) => {
  const ivId = req.params.id;

  const updateInvoiceSql = `UPDATE invoice 
                              SET iv_date = ?, iv_credit = ?, iv_total = ?, iv_detail = ?, 
                                  iv_vat = ?, iv_tax = ?, employee_id = ?, customer_id = ?, iv_dateend = ?
                              WHERE iv_id = ?`;

  db.query(
    updateInvoiceSql,
    [
      req.body.iv_date,
      req.body.iv_credit,
      req.body.iv_total,
      req.body.iv_detail,
      req.body.iv_vat,
      req.body.iv_tax,
      req.body.employee_id,
      req.body.customer_id,
      req.body.iv_dateend,
      ivId,
    ],
    async (err) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ msg: "Update ข้อมูลใบแจ้งหนี้ผิดพลาด" });
      }

      const sqlListb = `SELECT listi_number, product_id
                        FROM listi WHERE iv_id = ?`;

      const [existingItems] = await db.promise().query(sqlListb, [ivId]);

      const existingItemMap = new Map();
      existingItems.forEach((item) => {
        const key = `${item.product_id}-${item.listi_number}`;
        existingItemMap.set(key, item);
      });

      const newItemMap = new Map();
      req.body.items.forEach((item) => {
        const key = `${item.product_id}-${item.listi_number}`;
        newItemMap.set(key, item);
      });

      const toInsert = [];
      const toUpdate = [];
      const toDelete = [];

      newItemMap.forEach((item, key) => {
        if (existingItemMap.has(key)) {
          toUpdate.push(item);
          existingItemMap.delete(key);
        } else {
          toInsert.push(item);
        }
      });

      existingItemMap.forEach((item, key) => {
        toDelete.push(item);
      });

      const insertPromises = toInsert.map((item, index) => {
        return db.promise().query(
          `INSERT INTO listi (listi_number, listi_price, listi_amount, listi_total, product_id, lot_number, iv_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            item.listi_number,
            item.product_price,
            item.listi_amount,
            item.listi_total,
            item.product_id,
            item.lot_number,
            ivId,
          ]
        );
      });

      const updatePromises = toUpdate.map((item) => {
        return db.promise().query(
          `UPDATE listi SET listi_price = ?, listi_amount = ?, listi_total = ?, lot_number = ? 
           WHERE  listi_number = ? AND iv_id = ?`,
          [
            item.product_price,
            item.listi_amount,
            item.listi_total,
            item.lot_number,
            item.listi_number,
            ivId,
          ]
        );
      });

      const deletePromises = toDelete.map((item) => {
        return db
          .promise()
          .query(`DELETE FROM listi WHERE listi_number = ? AND iv_id = ?`, [
            item.listi_number,
            ivId,
          ]);
      });

      try {
        await Promise.all([
          ...insertPromises,
          ...updatePromises,
          ...deletePromises,
        ]);
        res
          .status(200)
          .json({ msg: "แก้ไขใบแจ้งหนี้เสนอราคาและรายการสินค้าเรียบร้อยแล้ว" });
      } catch (err) {
        console.log(err);
        res
          .status(500)
          .json({ msg: "เกิดข้อผิดพลาดในการปรับปรุงรายการสินค้า" });
      }
    }
  );
});

// เหลือการ auth ก่อนการ delete
app.delete("/invoice/delete/:id", (req, res) => {
  const sql = `
    UPDATE invoice 
    SET 
      iv_del = ?
    WHERE iv_id = ?;
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
    res.status(201).json({
      msg: "ลบเรียบร้อยแล้ว",
      data: result,
    });
    return;
  });
});

//ทำเสร็จแล้วอย่าลืมดูว่า rc_type ต้องใช้ฤป่าว
app.get("/receipt", function (req, res) {
  let fetch =
    "SELECT b.rc_id, b.rc_date, c.customer_fname,e.employee_fname, b.rc_total, b.rc_status,b.rc_type,b.rc_tax,rc_detail FROM receipt b JOIN employee e ON b.employee_id = e.employee_id JOIN customer c ON c.customer_id = b.customer_id WHERE b.rc_del = '0'";
  let fetchValue = [];
  const page = parseInt(req.query.page);
  const per_page = parseInt(req.query.per_page);
  const sort_by = req.query.sort_by;
  const sort_type = req.query.sort_type;
  const search = req.query.search;
  const idx_start = (page - 1) * per_page;

  if (search) {
    fetch += ` AND (
      b.rc_id LIKE ?
      OR c.customer_fname LIKE ?
      OR b.rc_date LIKE ?
    )`;
    fetchValue = Array(3).fill(`${search}%`);
  }

  if (sort_by && sort_type) {
    fetch += " ORDER BY " + sort_by + " " + sort_type;
  }

  fetch += " LIMIT ?, ?";
  fetchValue.push(idx_start);
  fetchValue.push(per_page);

  db.execute(fetch, fetchValue, (err, result, field) => {
    if (!err) {
      db.query(
        "SELECT COUNT(rc_id) AS total FROM receipt WHERE rc_del='0'",
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

app.post("/receipt/insert", async (req, res) => {
  const sql = `insert into receipt (rc_id,rc_date,rc_status,rc_total,rc_del,rc_detail,rc_vat,rc_tax,employee_id,customer_id,rc_type) values (?,?,?,?,?,?,?,?,?,?,?)`;
  const sqlInertIvRc =
    "insert into invoice_has_receipt (rc_id,iv_id) values (?,?)";
  const next = await db
    .promise()
    .query(
      `select LPAD(IFNULL(Max(SUBSTR(rc_id, 12, 5)),0)+1,5,'0') as next from receipt ;`
    );

  const idnext =
    "RC" +
    moment(req.body.receipt_date).format("YYYYMMDD") +
    "-" +
    next[0][0].next;
  db.query(
    sql,
    [
      idnext,
      req.body.receipt_date,
      "รอเก็บเงิน",
      req.body.receipt_total,
      "0",
      req.body.receipt_detail,
      req.body.receipt_vat,
      req.body.receipt_tax,
      req.body.employee_id,
      req.body.customer_id,
      "เดี่ยว", //ความจริงต้องเอามาจากข้อมูลใบที่สร้าง
    ],
    (err) => {
      if (err) {
        console.log(err);
        return res
          .status(500)
          .json({ msg: "insert ข้อมูลใบวางบิลผิด ไม่เกี่ยวกับรายการ" });
      }
      if (req.body.items && req.body.items.length > 0) {
        let success = true; // ตั้งค่าเริ่มต้นเป็น true
        req.body.items.forEach((item, index) => {
          db.query(
            `insert into listr (listr_number,listr_price,listr_amount,listr_total,product_id,lot_number,rc_id) values (?,?,?,?,?,?,?)`,
            [
              item.listi_number,
              item.product_price,
              item.listi_amount,
              item.listi_total,
              item.product_id,
              item.lot_number,
              idnext,
            ],
            (err) => {
              if (err) {
                console.log(err);
                success = false; // ถ้าเกิดข้อผิดพลาดในการเพิ่มรายการสินค้า เปลี่ยนเป็น false
              }
              // ให้ส่งการตอบกลับไปยังไคลเอนต์เมื่อวนลูปเสร็จสิ้น
              if (index === req.body.items.length - 1) {
                if (success) {
                  if (req.body.iv_id) {
                    db.query(sqlInertIvRc, [idnext, req.body.iv_id]);
                    updateStatus(req.body.iv_id, "ดำเนินการแล้ว", res);
                  }
                  res.status(201).json({
                    msg: "เพิ่มใบแล้ว",
                  });
                } else {
                  res.status(500).json({
                    msg: "เกิดข้อผิดพลาดในการเพิ่มรายการสินค้า",
                  });
                }
              }
            }
          );
        });
      } else {
        res.status(201).json({
          msg: "เพิ่มใบแล้ว",
        });
      }
    }
  );
});

app.get("/getreceipt/:id", function (req, res) {
  const rcId = req.params.id;
  const sqlReceipt = `SELECT rc_date, rc_total,  rc_detail, rc_vat, rc_tax, employee_id, customer_id ,rc_type FROM receipt WHERE rc_id = ?;`;

  db.query(sqlReceipt, [rcId], (err, rcDetail) => {
    if (err) {
      console.log(err);
      return res.json(err);
    }

    const sqlListq = `SELECT listr_number, listr_price, listr_amount, listr_total, product_id, lot_number FROM listr WHERE rc_id = ?;`;
    db.query(sqlListq, [rcId], (err, listrDetail) => {
      if (err) {
        console.log(err);
        return res.json(err);
      }
      const productIds = listrDetail.map((item) => item.product_id);

      // ตรวจสอบว่าอาร์เรย์ productIds ไม่ว่างเปล่า
      if (productIds.length === 0) {
        return res.json({
          rcDetail: rcDetail,
          listrDetail: listrDetail,
          productDetail: [],
          employee_name: "",
          message: "ไม่พบสินค้าสำหรับรหัสบิลที่กำหนด",
        });
      }

      const sqlProduct = `SELECT product_id, product_name, product_price, product_img, unit.unit_name FROM product JOIN unit ON product.unit_id = unit.unit_id WHERE product_id IN (?);`;
      db.query(sqlProduct, [productIds], (err, productDetail) => {
        if (err) {
          console.log(err);
          return res.json(err);
        }

        const sqlEmployee_name =
          'SELECT CONCAT(employee_fname, " ", employee_lname) AS employee_name FROM employee WHERE employee_id = ?;';

        db.query(
          sqlEmployee_name,
          [rcDetail[0].employee_id],
          (err, employee_nameResult) => {
            if (err) {
              console.log(err);
              return res.json(err);
            }
            const employee_name = employee_nameResult[0]
              ? employee_nameResult[0].employee_name
              : "";
            return res.json({
              rcDetail: rcDetail,
              listrDetail: listrDetail,
              productDetail: productDetail,
              employee_name: employee_name,
            });
          }
        );
      });
    });
  });
});

app.put("/receipt/status", function (req, res) {
  const { status, rc_id } = req.body;
  const sql = "update receipt set rc_status = ? where rc_id = ?";
  db.query(sql, [status, rc_id]);
});

app.put("/receipt/money", function (req, res) {
  const { rc_id, rc_date, rc_detail, rc_pay, bank_id } = req.body;
  let sql =
    // ลบอัพเดท สเตตัสออกมาลองดูว่า error ไหม
    "update receipt set  rc_date =? ,rc_detail =? ,rc_pay =? ";
  let values = [rc_date, rc_detail, rc_pay];
  if (bank_id) {
    sql += ", bank_id =? ";
    values.push(bank_id);
  }
  sql += "where rc_id = ?";
  values.push(rc_id);
  db.query(sql, values, (err) => {
    if (err) {
      console.err(err);
      res.json(err);
    } else {
      res.json("บันทึกการรับเงินเรียบร้อย");
    }
  });
});

app.put("/receiptCash/money", function (req, res) {
  const { rf_id, rf_date, rf_detail, rf_pay, bank_id } = req.body;
  let sql = "update receiptcash set  rf_date =? ,rf_detail =? ,rf_pay =? ";
  let values = [rf_date, rf_detail, rf_pay];
  if (bank_id) {
    sql += ", bank_id =? ";
    values.push(bank_id);
  }
  sql += "where rf_id = ?";
  values.push(rf_id);
  db.query(sql, values, (err) => {
    if (err) {
      console.error(err);
      res.json(err);
    } else {
      res.json("บันทึกการรับเงินเรียบร้อย");
    }
  });
});

app.delete("/receipt/delete/:id", (req, res) => {
  const sql = `
    UPDATE receipt 
    SET 
      rc_del = ?
    WHERE rc_id = ?;
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
    res.status(201).json({
      msg: "ลบเรียบร้อยแล้ว",
      data: result,
    });
    return;
  });
});

app.get("/receiptcash", function (req, res) {
  let fetch =
    "SELECT i.rf_id, i.rf_date, c.customer_fname,e.employee_fname, i.rf_total, i.rf_status FROM receiptcash i JOIN employee e ON i.employee_id = e.employee_id LEFT OUTER JOIN customer c ON c.customer_id = i.customer_id WHERE i.rf_del = '0'";
  let fetchValue = [];
  const page = parseInt(req.query.page);
  const per_page = parseInt(req.query.per_page);
  const sort_by = req.query.sort_by;
  const sort_type = req.query.sort_type;
  const search = req.query.search;
  const idx_start = (page - 1) * per_page;

  if (search) {
    fetch += ` AND (
      i.rf_id LIKE ?
      OR c.customer_fname LIKE ?
      OR i.rf_date LIKE ?
    )`;
    fetchValue = Array(3).fill(`${search}%`);
  }

  if (sort_by && sort_type) {
    fetch += " ORDER BY " + sort_by + " " + sort_type;
  }

  fetch += " LIMIT ?, ?";
  fetchValue.push(idx_start);
  fetchValue.push(per_page);

  db.execute(fetch, fetchValue, (err, result, field) => {
    if (!err) {
      db.query(
        "SELECT COUNT(rf_id) AS total FROM receiptcash WHERE rf_del='0'",
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

app.post("/receiptcash/insert", async (req, res) => {
  const sqlInsertInvoice = `insert into receiptcash (rf_id,rf_date,rf_status,rf_total,rf_del,rf_detail,rf_vat,rf_tax,employee_id,customer_id) values (?,?,?,?,?,?,?,?,?,?)`;
  const sqlSelectNext = `select LPAD(IFNULL(Max(SUBSTR(rf_id, 12, 5)),0)+1,5,'0') as next from receiptcash ;`;

  try {
    const connection = await pool.promise().getConnection();
    await connection.beginTransaction();

    try {
      const [next] = await connection.query(sqlSelectNext);

      const idnext =
        "RF" + moment(req.body.rf_date).format("YYYYMMDD") + "-" + next[0].next;
      await connection.query(sqlInsertInvoice, [
        idnext,
        req.body.rf_date,
        "รอเก็บเงิน",
        req.body.rf_total,
        "0",
        req.body.rf_detail,
        req.body.rf_vat,
        req.body.rf_tax,
        req.body.employee_id,
        req.body.customer_id ? req.body.customer_id : null,
      ]);
      if (req.body.items && req.body.items.length > 0) {
        const itemPromises = req.body.items.map((item, index) =>
          connection.query(
            `insert into listrf (listrf_number,listrf_price,listrf_amount,listrf_total,product_id,lot_number,rf_id) values (?,?,?,?,?,?,?)`,
            [
              index + 1,
              item.product_price,
              item.listrf_amount,
              item.listrf_total,
              item.product_id,
              item.lot_number,
              idnext,
            ]
          )
        );
        await Promise.all(itemPromises);
      }

      await connection.commit();
      res.status(201).json({ msg: "เพิ่มใบแล้ว" });
    } catch (err) {
      console.error(err);
      await connection.rollback();
      res.status(500).json({ msg: "เกิดข้อผิดพลาดในการเพิ่มรายการสินค้า" });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล" });
  }
});

app.get("/getreceiptcash/:id", function (req, res) {
  const rfId = req.params.id;
  const sqlReceiptCash = `SELECT rf_date, rf_total, rf_detail, rf_vat, rf_tax, employee_id, customer_id  FROM receiptcash WHERE rf_id = ?;`;
  const sqlListq = `SELECT listrf_number, listrf_price, listrf_amount, listrf_total, product_id, lot_number FROM listrf WHERE rf_id = ?;`;
  db.query(sqlReceiptCash, [rfId], (err, rfDetail) => {
    if (err) {
      console.log(err);
      return res.json(err);
    }

    db.query(sqlListq, [rfId], (err, listrf_Detail) => {
      if (err) {
        console.log(err);
        return res.json(err);
      }
      const productIds = listrf_Detail.map((item) => item.product_id);

      // ตรวจสอบว่าอาร์เรย์ productIds ไม่ว่างเปล่า
      if (productIds.length === 0) {
        return res.json({
          rfDetail: rfDetail,
          listrf_Detail: listrf_Detail,
          productDetail: [],
          employee_name: "",
          message: "ไม่พบสินค้าสำหรับรหัสบิลที่กำหนด",
        });
      }

      const sqlProduct = `SELECT product_id, product_name, product_price, product_img, unit.unit_name FROM product JOIN unit ON product.unit_id = unit.unit_id WHERE product_id IN (?);`;
      db.query(sqlProduct, [productIds], (err, productDetail) => {
        if (err) {
          console.log(err);
          return res.json(err);
        }

        const sqlEmployee_name =
          'SELECT CONCAT(employee_fname, " ", employee_lname) AS employee_name FROM employee WHERE employee_id = ?;';
        db.query(
          sqlEmployee_name,
          [rfDetail[0].employee_id],
          (err, employee_nameResult) => {
            if (err) {
              console.log(err);
              return res.json(err);
            }

            const employee_name = employee_nameResult[0]
              ? employee_nameResult[0].employee_name
              : "";
            return res.json({
              rfDetail: rfDetail,
              listrf_Detail: listrf_Detail,
              productDetail: productDetail,
              employee_name: employee_name,
            });
          }
        );
      });
    });
  });
});

app.put("/receiptcash/edit/:id", async (req, res) => {
  const rfId = req.params.id;

  const updateInvoiceSql = `UPDATE receiptcash 
                              SET rf_date = ?, rf_total = ?, rf_detail = ?, 
                                  rf_vat = ?, rf_tax = ?,  customer_id = ?
                              WHERE rf_id = ?`;

  db.query(
    updateInvoiceSql,
    [
      req.body.rf_date,
      req.body.rf_total,
      req.body.rf_detail,
      req.body.rf_vat,
      req.body.rf_tax,
      req.body.customer_id ? req.body.customer_id : null,
      rfId,
    ],
    async (err) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ msg: "Update ข้อมูลผิดพลาด" });
      }

      const sqlListrf = `SELECT listrf_number, product_id
                        FROM listrf WHERE rf_id = ?`;

      const [existingItems] = await db.promise().query(sqlListrf, [rfId]);

      const existingItemMap = new Map();
      existingItems.forEach((item) => {
        const key = `${item.product_id}-${item.listrf_number}`;
        existingItemMap.set(key, item);
      });

      const newItemMap = new Map();
      req.body.items.forEach((item) => {
        const key = `${item.product_id}-${item.listrf_number}`;
        newItemMap.set(key, item);
      });

      const toInsert = [];
      const toUpdate = [];
      const toDelete = [];

      newItemMap.forEach((item, key) => {
        if (existingItemMap.has(key)) {
          toUpdate.push(item);
          existingItemMap.delete(key);
        } else {
          toInsert.push(item);
        }
      });

      existingItemMap.forEach((item, key) => {
        toDelete.push(item);
      });

      const insertPromises = toInsert.map((item, index) => {
        return db.promise().query(
          `INSERT INTO listrf (listrf_number, listrf_price, listrf_amount, listrf_total, product_id, lot_number, rf_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            item.listrf_number,
            item.product_price,
            item.listrf_amount,
            item.listrf_total,
            item.product_id,
            item.lot_number,
            rfId,
          ]
        );
      });

      const updatePromises = toUpdate.map((item) => {
        return db.promise().query(
          `UPDATE listrf SET listrf_price = ?, listrf_amount = ?, listrf_total = ?, lot_number = ? 
           WHERE  listrf_number = ? AND rf_id = ?`,
          [
            item.product_price,
            item.listrf_amount,
            item.listrf_total,
            item.lot_number,
            item.listrf_number,
            rfId,
          ]
        );
      });

      const deletePromises = toDelete.map((item) => {
        return db
          .promise()
          .query(`DELETE FROM listrf WHERE listrf_number = ? AND rf_id = ?`, [
            item.listrf_number,
            rfId,
          ]);
      });

      try {
        await Promise.all([
          ...insertPromises,
          ...updatePromises,
          ...deletePromises,
        ]);
        res.status(200).json({ msg: "แก้ไขใบและรายการสินค้าเรียบร้อยแล้ว" });
      } catch (err) {
        console.log(err);
        res
          .status(500)
          .json({ msg: "เกิดข้อผิดพลาดในการปรับปรุงรายการสินค้า" });
      }
    }
  );
});

// เหลือการ auth ก่อนการ delete
app.delete("/receiptcash/delete/:id", (req, res) => {
  const sql = `
    UPDATE receiptcash 
    SET 
      rf_del = ?
    WHERE rf_id = ?;
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
    res.status(201).json({
      msg: "ลบเรียบร้อยแล้ว",
      data: result,
    });
    return;
  });
});

app.get("/out", function (req, res) {
  let fetch =
    "SELECT o.out_id, o.out_date, e.employee_fname, o.out_total, o.out_status FROM expense o JOIN employee e ON o.employee_id = e.employee_id WHERE o.out_del = '0'";
  let fetchValue = [];
  const page = parseInt(req.query.page);
  const per_page = parseInt(req.query.per_page);
  const sort_by = req.query.sort_by;
  const sort_type = req.query.sort_type;
  const search = req.query.search;
  const idx_start = (page - 1) * per_page;

  if (search) {
    fetch += ` AND (
      o.out_id LIKE ?
      OR c.customer_fname LIKE ?
      OR o.out_date LIKE ?
    )`;
    fetchValue = Array(3).fill(`${search}%`);
  }

  if (sort_by && sort_type) {
    fetch += " ORDER BY " + sort_by + " " + sort_type;
  }

  fetch += " LIMIT ?, ?";
  fetchValue.push(idx_start);
  fetchValue.push(per_page);

  db.execute(fetch, fetchValue, (err, result, field) => {
    if (!err) {
      db.query(
        "SELECT COUNT(out_id) AS total FROM expense WHERE out_del='0'",
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

app.post("/out/insert", uploadExpense.array("img"), async (req, res) => {
  const items = JSON.parse(req.body.items);
  const sql = `INSERT INTO expense (Out_id, Out_date, Out_status, Out_total, Out_del, Out_detail, employee_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const sqlInsertImg = "INSERT INTO outimg (out_id, outimg) VALUES (?, ?)";
  const imageFiles = req.files;

  const connection = await pool.promise().getConnection();

  try {
    await connection.beginTransaction();

    const [next] = await connection.query(
      `SELECT LPAD(IFNULL(MAX(SUBSTR(out_id, 12, 5)), 0) + 1, 5, '0') AS next FROM expense;`
    );

    const idNext =
      "OT" + moment(req.body.out_date).format("YYYYMMDD") + "-" + next[0].next;

    await connection.query(sql, [
      idNext,
      req.body.out_date,
      "รอจ่ายเงิน",
      req.body.out_total,
      "0",
      req.body.out_detail,
      req.body.employee_id,
    ]);

    if (items && items.length > 0) {
      let index = 1;
      for (const item of items) {
        await connection.query(
          `INSERT INTO listout (listo_number,listo_name, listo_price, listo_amount, listo_total, Out_id, expensetype_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            index, // ใช้ index
            item.listo_name,
            item.listo_price,
            item.listo_amount,
            item.listo_total,
            idNext,
            item.expensetype_id,
          ]
        );
        index++;
      }
    }

    if (imageFiles && imageFiles.length > 0) {
      for (const file of imageFiles) {
        await connection.query(sqlInsertImg, [idNext, file.filename]);
      }
    }

    await connection.commit();
    res.status(201).json({ msg: "เพิ่มใบแล้ว" });
  } catch (err) {
    await connection.rollback();
    console.log(err);
    res.status(500).json({ msg: "เกิดข้อผิดพลาดในการเพิ่มข้อมูล" });
  } finally {
    connection.release();
  }
});

app.post("/out/edit/:id", uploadExpense.array("img"), async (req, res) => {
  const items = JSON.parse(req.body.items);
  const oldImages = JSON.parse(req.body.oldImage);
  const outId = req.params.id;
  const sqlUpdateOut = `UPDATE expense SET Out_date = ?, Out_status = ?, Out_total = ?, Out_detail = ? WHERE Out_id = ?`;
  const sqlDeleteListOut = `DELETE FROM listout WHERE Out_id = ?`;
  const sqlInsertListOut = `INSERT INTO listout (listo_number, listo_name, listo_price, listo_amount, listo_total, Out_id, expensetype_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const sqlDeleteOutImg = `DELETE FROM outimg WHERE out_id = ?`;
  const sqlInsertOutImg = "INSERT INTO outimg (out_id, outimg) VALUES (?, ?)";
  const imageFiles = req.files;

  const connection = await pool.promise().getConnection();

  try {
    await connection.beginTransaction();

    // อัพเดตข้อมูลเอกสาร
    await connection.query(sqlUpdateOut, [
      req.body.out_date,
      "รอจ่ายเงิน",
      req.body.out_total,
      req.body.out_detail,
      outId,
    ]);

    // ลบรายการค่าใช้จ่ายเก่า
    await connection.query(sqlDeleteListOut, [outId]);

    // เพิ่มรายการค่าใช้จ่ายใหม่
    if (items && items.length > 0) {
      let index = 1;
      for (const item of items) {
        await connection.query(sqlInsertListOut, [
          index, // ใช้ index
          item.listo_name,
          item.listo_price,
          item.listo_amount,
          item.listo_total,
          outId,
          item.expensetype_id,
        ]);
        index++;
      }
    }

    // ลบรูปภาพเก่า
    await connection.query(sqlDeleteOutImg, [outId]);

    // เพิ่มรูปภาพใหม่
    if (imageFiles && imageFiles.length > 0) {
      for (const file of imageFiles) {
        await connection.query(sqlInsertOutImg, [outId, file.filename]);
      }
      // ลบรูปภาพเก่าออกจากโฟลเดอร์
      oldImages.forEach((img) => {
        const filePath = path.join(__dirname, "img", "expense", img.outimg);
        console.log(filePath);
        fs.unlink(filePath, (err) => {
          if (err) {
            console.log(`Failed to delete image: ${img.outimg}`, err);
          }
        });
      });
    }

    await connection.commit();
    res.status(200).json({ msg: "แก้ไขข้อมูลสำเร็จ" });
  } catch (err) {
    await connection.rollback();
    console.log(err);
    res.status(500).json({ msg: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" });
  } finally {
    connection.release();
  }
});

app.get("/getout/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [outData] = await db
      .promise()
      .query(
        `SELECT out_date,out_total,out_detail,employee_id FROM expense WHERE Out_id = ?`,
        [id]
      );
    const [listData] = await db
      .promise()
      .query(
        `SELECT listo_number,listo_name,listo_price,listo_amount,listo_total,expensetype_name FROM listout join expensetype on listout.expensetype_id = expensetype.expensetype_id WHERE Out_id = ?`,
        [id]
      );
    const [imagesData] = await db
      .promise()
      .query(`SELECT outimg FROM outimg WHERE out_id = ?`, [id]);

    res.json({
      outData: outData[0],
      listData,
      imagesData,
    });
  } catch (error) {
    res.status(500).json({ msg: "Error fetching data", error });
  }
});

app.delete("/out/delete/:id", (req, res) => {
  const sql = `
    UPDATE expense 
    SET 
      out_del = ?
    WHERE out_id = ?;
  `;
  const id = req.params.id;
  const values = ["1", id];
  console.log(id);
  db.execute(sql, values, (err, result) => {
    if (err) {
      res.status(500).json({
        msg: "Error delete department",
      });
      return;
    }
    res.status(201).json({
      msg: "ลบเรียบร้อยแล้ว",
      data: result,
    });
    return;
  });
});

app.get("/getcustomers", (req, res) => {
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
app.get("/img/expense/:imageName", (req, res) => {
  const imageName = req.params.imageName;
  const imagePath = path.join(__dirname, "img", "expense", imageName);

  // ส่งไฟล์ภาพกลับไปให้กับผู้ใช้
  res.sendFile(imagePath);
});

app.get("/pdf", async (req, res) => {
  console.log("am in");
  const id = req.query.id;
  let sqlSelect;
  let sqlList;

  let header;
  let tableName;
  let idField;
  let listname;
  let numberQT;

  if (id.startsWith("QT")) {
    header = `ใบเสนอราคา`;
    tableName = "quotation";
    idField = "quotation";
    listname = "listq";
    numberQT = req.query.numberQT;
    sqlSelect = `SELECT quotation_num, quotation_date, quotation_total, quotation_credit, quotation_detail, quotation_vat, quotation_tax, quotation_status, employee_id, customer_id FROM quotation WHERE quotation_id = ?;`;
    sqlList = `SELECT listq_number, listq_price, listq_amount, listq_total, product_id, lot_number,  quotation_num FROM listq WHERE quotation_id = ?;`;
  } else if (id.startsWith("BN")) {
    header = `ใบวางบิล`;
    tableName = "bill";
    idField = "bn";
    listname = "listb";
    sqlSelect = `SELECT bn_date, bn_total, bn_credit, bn_detail, bn_vat, bn_tax, employee_id, customer_id ,bn_type,bn_dateend FROM bill WHERE bn_id = ?;`;
    sqlList = `SELECT listb_number, listb_price, listb_amount, listb_total, product_id, lot_number FROM listb WHERE bn_id = ?;`;
  } else if (id.startsWith("IV")) {
    header = `ใบแจ้งหนี้`;
    tableName = "invoice";
    idField = "iv";
    listname = "listi";
    sqlSelect = `SELECT iv_date, iv_total, iv_credit, iv_detail, iv_vat, iv_tax, employee_id, customer_id ,iv_dateend FROM invoice WHERE iv_id = ?;`;
    sqlList = `SELECT listi_number, listi_price, listi_amount, listi_total, product_id, lot_number FROM listi WHERE iv_id = ?;`;
  } else if (id.startsWith("RC")) {
    header = `ใบเสร็จรับเงิน`;
    tableName = "receipt";
    idField = "rc";
    listname = "listr";
    sqlSelect = `SELECT rc_date, rc_total,  rc_detail, rc_vat, rc_tax, employee_id, customer_id ,rc_type FROM receipt WHERE rc_id = ?;`;
    sqlList = `SELECT listr_number, listr_price, listr_amount, listr_total, product_id, lot_number FROM listr WHERE rc_id = ?;`;
  } else {
    return res.status(400).send("ไม่มีใบที่คุณให้มา");
  }
  const [result] = await db
    .promise()
    .query(sqlSelect, [id, numberQT ? numberQT : ""]);

  const sqlEmployee_name =
    'SELECT CONCAT(employee_fname, " ", employee_lname) as employee_name FROM employee WHERE employee_id = ?;';
  const [employee_nameResult] = await db
    .promise()
    .query(sqlEmployee_name, [result[0].employee_id]);
  const employee_name = employee_nameResult[0].employee_name;

  const [lists] = await db
    .promise()
    .query(sqlList, [id, numberQT ? numberQT : ""]);

  // ข้อมูลรายละเอียดลูกค้า
  const customerDetails = await db
    .promise()
    .query(
      "SELECT concat(customer_fname +' '+ customer_lname) as customer_name , customer_address FROM customer WHERE customer_id = ?",
      [result[0].customer_id]
    );
  const customer = customerDetails[0][0];

  console.log(result, employee_name, lists);

  const doc = new PDFDocument({ size: "A4" });

  doc.pipe(fs.createWriteStream(header + id + `.pdf`));
  // Embed the Thai font
  doc.registerFont("THSarabunNew", "fonts/THSarabunNew.ttf");
  doc.font("THSarabunNew");

  // Header Section
  doc.fontSize(20).text(header, 390, 40);

  // หัวข้อทางด้านขวา
  doc.fontSize(14).text("บริษัท ฮับ วอเตอร์เทค จำกัด (สำนักงานใหญ่)", 48, 80);
  doc.text("โทร. 123547896", 48, 95);

  doc.text("ลูกค้า: " + customer.customer_name, 48, 120);
  doc.text(customer.customer_address, 48, 140);

  //หัวข้อทางด้านซ้าย
  const rightSide = 350;
  doc.text("เลขที่ ", rightSide, 80);
  doc.text(id, rightSide + 40, 80);
  doc.text("วันที่", rightSide, 100);
  doc.text(
    moment(result[0][`${idField}_date`]).format("DD-MM-YYYY"),
    rightSide + 40,
    100
  );
  doc.text("เครดิต", rightSide, 120);
  doc.text(result[0][`${idField}_credit`], rightSide + 40, 120);
  doc.text("ผู้ขาย", rightSide, 140);
  doc.text(employee_name, rightSide + 40, 140);
  let hight = 80;

  for (let index = 0; index < 4; index++) {
    doc.text(":", 380, hight);
    hight += 20;
  }

  //ความสูงของบตารารางเป็นต้นไป
  let y = 210;
  // หัวข้อตาราง
  doc.text("ลำดับ", 48, y, { width: 22, align: "center" });
  doc.text("ชื่อสินค้า", 100, y, { width: 70, align: "center" });
  doc.text("เลขล็อต", 170, y, { width: 140, align: "center" });
  doc.text("ราคาต่อหน่วย", 310, y, { width: 80, align: "right" });
  doc.text("จำนวน", 390, y, { width: 60, align: "right" });
  doc.text("ยอดรวม", 450, y, { width: 60, align: "right" });

  lists.forEach((item, index) => {
    doc.text(item[`${listname}_number`], 48, y + 20, {
      width: 22,
      align: "center",
    });
    doc.text(item.product_id, 100, y + 20, { width: 70, align: "center" });
    doc.text(item.lot_number, 170, y + 20, { width: 140, align: "center" });
    doc.text(item[`${listname}_price`], 310, y + 20, {
      width: 80,
      align: "right",
    });
    doc.text(item[`${listname}_amount`], 390, y + 20, {
      width: 60,
      align: "right",
    });
    doc.text(item[`${listname}_total`], 450, y + 20, {
      width: 60,
      align: "right",
    });
    y += 20;
  });

  doc.text("รวมเป็นเงิน", rightSide, y + 40);
  doc.text(result[0][`${idField}_total`] + " บาท", rightSide + 100, y + 40);
  doc.text("ภาษีมูลค่าเพิ่ม 7%", rightSide, y + 60);
  doc.text(result[0][`${idField}_vat`] + " บาท", rightSide + 100, y + 60);
  doc.text("จำนวนเงินรวมทั้งสิ้น", rightSide, y + 80);
  doc.text(
    result[0][`${idField}_total`] + result[0][`${idField}_vat`] + " บาท",
    rightSide + 100,
    y + 80
  );
  doc.text("หักภาษี ณ ที่จ่าย 3%", rightSide, y + 100);
  doc.text(result[0][`${idField}_tax`] + " บาท", rightSide + 100, y + 100);
  doc.text("ยอดชำระ", rightSide, y + 120);
  doc.text(
    result[0][`${idField}_total`] +
      result[0][`${idField}_vat`] -
      result[0][`${idField}_tax`] +
      " บาท",
    rightSide + 100,
    y + 120
  );

  doc.end();

  // stream.on('finish', function() {
  //   res.download(header);
  // });
  // }
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
