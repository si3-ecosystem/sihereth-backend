const express = require("express");
const { approveUser, loginUser, validateToken } = require("../controllers/auth.controller");
const auth = require("../middlewares/auth");

const router = express.Router();

router.get("/approve", approveUser);
router.post("/login", loginUser);
router.get("/validate-token", auth, validateToken);

module.exports = router;
