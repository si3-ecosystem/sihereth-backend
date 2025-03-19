const express = require("express");
const {
  approveUser,
  loginUser,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth.controller");

const router = express.Router();

router.get("/approve", approveUser);
router.post("/login", loginUser);
router.post("/forgot", forgotPassword);
router.post("/reset", resetPassword);

module.exports = router;
