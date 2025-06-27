const express = require("express");
const { publishDomain } = require("../controllers/domain.controller");
const router = express.Router();
const auth = require("../middlewares/auth");

router.post("/publish", auth, publishDomain);

module.exports = router;
