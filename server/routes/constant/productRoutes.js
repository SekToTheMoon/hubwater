const express = require("express");
const router = express.Router();
const { db } = require("../../database");
const { uploadProduct } = require("../../middleware/diskStorage");
const { getNextID } = require("../../utils/generateId");

router.get("/product", function (req, res) {
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

router.post(
  "/product/insert",
  uploadProduct.single("img"),
  async (req, res) => {
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
  }
);

router.get("/getproduct/:id", (req, res) => {
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

router.put(
  "/product/edit/:id",
  uploadProduct.single("img"),
  async (req, res) => {
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
  }
);

router.delete("/product/delete/:id", (req, res) => {
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

module.exports = router;
