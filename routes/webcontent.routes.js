const express = require("express");
const router = express.Router();
const { publishWebContent, updateWebContent } = require("../controllers/webcontent.controller");

router.post("/publish", publishWebContent);
router.post("/update", updateWebContent);

module.exports = router;
