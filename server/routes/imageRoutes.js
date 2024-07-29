const express = require("express");
const router = express.Router();
const path = require("path");
router.get("/img/avatar/:imageName", (req, res) => {
  const imageName = req.params.imageName;
  const imagePath = path.join(__dirname, "..", "img", "avatar", imageName);

  // ส่งไฟล์ภาพกลับไปให้กับผู้ใช้
  res.sendFile(imagePath);
});
router.get("/img/product/:imageName", (req, res) => {
  const imageName = req.params.imageName;
  const imagePath = path.join(__dirname, "..", "img", "product", imageName);

  // ส่งไฟล์ภาพกลับไปให้กับผู้ใช้
  res.sendFile(imagePath);
});
router.get("/img/expense/:imageName", (req, res) => {
  const imageName = req.params.imageName;
  const imagePath = path.join(__dirname, "..", "img", "expense", imageName);

  // ส่งไฟล์ภาพกลับไปให้กับผู้ใช้
  res.sendFile(imagePath);
});
router.get("/img/logo/:imageName", (req, res) => {
  const imageName = req.params.imageName;
  const imagePath = path.join(__dirname, "..", "img", "logo", imageName);

  // ส่งไฟล์ภาพกลับไปให้กับผู้ใช้
  res.sendFile(imagePath);
});
router.get("/img/signature/:imageName", (req, res) => {
  const imageName = req.params.imageName;
  const imagePath = path.join(__dirname, "..", "img", "signature", imageName);

  // ส่งไฟล์ภาพกลับไปให้กับผู้ใช้
  res.sendFile(imagePath);
});

module.exports = router;
