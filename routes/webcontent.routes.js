const express = require("express");
const router = express.Router();
const upload = require("../utils/multer");
const {
  publishWebContent,
  getWebContent,
  deleteWebContent,
  updateWebContent,
} = require("../controllers/webcontent.controller");

router.post("/publish", upload.any(), publishWebContent);
router.put("/update", upload.any(), updateWebContent);
router.get("/get", getWebContent);
router.delete("/delete", deleteWebContent);

module.exports = router;
