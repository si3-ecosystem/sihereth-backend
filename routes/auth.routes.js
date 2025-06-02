const express = require("express");
const { approveUser, loginUser } = require("../controllers/auth.controller");

const router = express.Router();

router.get("/approve", approveUser);
router.post("/login", loginUser);

module.exports = router;
