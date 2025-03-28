const express = require("express");
const router = express.Router();
const {
  createWebContent,
  getWebContent,
  updateWebContent,
  deleteWebContent,
} = require("../controllers/webcontent.controller");

router.post("/", createWebContent);
router.get("/", getWebContent);
router.put("/", updateWebContent);
router.delete("/", deleteWebContent);

module.exports = router;
