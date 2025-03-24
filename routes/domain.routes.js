const express = require("express");
const { publishDomain } = require("../controllers/domain.controller");
const router = express.Router();

router.post("/publish", publishDomain);

module.exports = router;
