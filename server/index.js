require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const verifyJWT = require("./middleware/verifyJWT");
const credentials = require("./middleware/credentials");

// function
const initSocket = require("./services/socket");
const updateStatus = require("./utils/updateStatus");

// const corsOptions = {
//   origin: ["http://localhost:5173", "https://hubwater.netlify.app"], // เปลี่ยนเป็นพอร์ตที่ React ใช้ทำงาน
//   methods: ["GET", "POST", "PUT", "DELETE"],
// };
// ตั้งค่ามิดเดิลแวร์
app.use(express.json());
app.use(credentials);
// app.use(cors(corsOptions));
app.use(cors());
app.use(cookieParser());

// สร้างเซิร์ฟเวอร์ HTTP
const server = http.createServer(app);
const io = initSocket(server);

// router
const pdfRoutes = require("./routes/pdfRoutes");
const login_logout = require("./routes/login_logout");
const logout = require("./routes/logOut");
const refresh = require("./routes/refresh");
const imageRoutes = require("./routes/imageRoutes");
const DashboardRoutes = require("./routes/DashboardRoutes");
const addressRoutes = require("./routes/addressRoutes");
const bankRoutes = require("./routes/constant/bankRoutes");
const brandRoutes = require("./routes/constant/brandRoutes");
const categoryRoutes = require("./routes/constant/categoryRoutes");
const companyRoutes = require("./routes/constant/companyRoutes");
const customerRoutes = require("./routes/constant/customerRoutes");
const departmentRoutes = require("./routes/constant/departmentRoutes");
const employeeRoutes = require("./routes/constant/employeeRoutes");
const expenseTypeRoutes = require("./routes/constant/expenseTypeRoutes");
const positionRoutes = require("./routes/constant/positionRoutes");
const productRoutes = require("./routes/constant/productRoutes");
const stockProductRoutes = require("./routes/constant/stockProductRoutes");
const unit_mRoutes = require("./routes/constant/unit_mRoutes");
const unitRoutes = require("./routes/constant/unitRoutes");
const quotationRoutes = require("./routes/document/quotationRoutes");
const expenseRoutes = require("./routes/document/expenseRoutes");
const receiptCashRoutes = require("./routes/document/receiptCashRoutes");

// ส่ง io ไปยัง route handler
const billRoutes = require("./routes/document/billRoutes")(io);
const invoiceRoutes = require("./routes/document/invoiceRoutes")(io);
const receiptRoutes = require("./routes/document/receiptRoutes")(io);

const routes = [
  pdfRoutes,
  DashboardRoutes,
  addressRoutes,
  bankRoutes,
  brandRoutes,
  categoryRoutes,
  companyRoutes,
  customerRoutes,
  departmentRoutes,
  employeeRoutes,
  expenseTypeRoutes,
  positionRoutes,
  productRoutes,
  stockProductRoutes,
  unit_mRoutes,
  unitRoutes,
  billRoutes,
  expenseRoutes,
  invoiceRoutes,
  quotationRoutes,
  receiptCashRoutes,
  receiptRoutes,
];

app.put("/updateStatus", (req, res) => {
  let { status, id } = req.body;
  updateStatus(io, id, status, res);
});

//อยู๋หน้า all ตรวจสอบผู้ใช้ต้องมี token
// app.post("/auth", (req, res) => {
//   try {
//     const token = req.headers.authorization.split(" ")[1];
//     const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
//     console.log(token + "from /auth at index.js");
//     return res.status(200).json(decoded);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// });

app.use(refresh);
app.use(login_logout);
app.use(logout);
app.use(imageRoutes);

// ต้องทำการ decode jwt ก่อนการ ทำงาน
app.use(verifyJWT);
routes.forEach((route) => app.use(route));

// เริ่มเซิร์ฟเวอร์
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
