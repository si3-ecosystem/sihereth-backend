const express = require("express");
const { getUsers, subscribeEmail } = require("../controllers/users.controller");

const router = express.Router();

router.get("/", getUsers);
router.get("/subscribe", subscribeEmail);

module.exports = router;
