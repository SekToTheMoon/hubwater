const path = require("path");
const multer = require("multer");
const uuid = require("uuid");

const storageAvatar = multer.diskStorage({
  destination: path.join(__dirname, "..", "img", "avatar"),
  filename: function (req, file, cb) {
    // null as first argument means no error
    cb(null, Date.now() + "-" + uuid.v4().substring(0, 8) + ".png");
  },
});

const storageProduct = multer.diskStorage({
  destination: path.join(__dirname, "..", "img", "product"),
  filename: function (req, file, cb) {
    // null as first argument means no error
    cb(null, Date.now() + "-" + uuid.v4().substring(0, 8) + ".png");
  },
});

const storageExpense = multer.diskStorage({
  destination: path.join(__dirname, "..", "img", "expense"),
  filename: function (req, file, cb) {
    // null as first argument means no error
    cb(null, Date.now() + "-" + uuid.v4().substring(0, 8) + ".png");
  },
});
// กำหนดการเก็บไฟล์
const storageCompany = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname && file.fieldname === "logo") {
      cb(null, path.join(__dirname, "img", "logo"));
    } else if (file.fieldname && file.fieldname === "signature") {
      cb(null, path.join(__dirname, "img", "signature"));
    } else {
      cb(new Error("Invalid image order"));
    }
  },
  filename: function (req, file, cb) {
    if (file.fieldname && file.fieldname === "logo") {
      cb(null, "logo.png");
    } else if (file.fieldname && file.fieldname === "signature") {
      cb(null, "signature.png");
    } else {
      cb(new Error("Invalid image order"));
    }
  },
});

// สร้างมิดเดิลแวร์สำหรับการอัปโหลดแต่ละประเภท
const uploadAvatar = multer({ storage: storageAvatar });
const uploadProduct = multer({ storage: storageProduct });
const uploadExpense = multer({ storage: storageExpense });
const uploadCompany = multer({ storage: storageCompany });

module.exports = {
  uploadAvatar,
  uploadProduct,
  uploadExpense,
  uploadCompany,
};
