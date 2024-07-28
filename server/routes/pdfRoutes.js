const express = require("express");
const { createPdf } = require("../services/pdfService");
const router = express.Router();

router.get("/pdf", async (req, res) => {
  const stream = res.writeHead(200, {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename=${req.query.id}.pdf`,
  });

  createPdf(
    req.query,
    (data) => stream.write(data),
    () => stream.end()
  );
});

module.exports = router;
