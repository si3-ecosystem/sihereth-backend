const express = require("express");
const router = express.Router();
const { publishWebContent, updateWebContent } = require("../controllers/webcontent.controller");
const auth = require("../middlewares/auth");

router.post("/publish", auth, publishWebContent);
router.post("/update", auth, updateWebContent);

module.exports = router;
