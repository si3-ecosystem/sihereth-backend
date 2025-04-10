const express = require("express");
const router = express.Router();
const {
  publishWebContent,
  getWebContent,
  deleteWebContent,
} = require("../controllers/webcontent.controller");

router.post("/publish", publishWebContent);
router.get("/get", getWebContent);
router.delete("/delete", deleteWebContent);

module.exports = router;
