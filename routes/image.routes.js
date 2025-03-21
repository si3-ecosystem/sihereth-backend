const express = require("express");
const fileUpload = require("express-fileupload");
const {
  uploadImage,
  getImages,
  getImageById,
  deleteImage,
} = require("../controllers/image.controller");

const router = express.Router();

router.post("/upload", fileUpload(), uploadImage);
router.get("/", getImages);
router.get("/:id", getImageById);
router.delete("/:id", deleteImage);

module.exports = router;
