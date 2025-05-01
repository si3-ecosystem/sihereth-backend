const express = require("express");
const router = express.Router();
const upload = require("../utils/multer");
const {
  publishWebContent,
  getWebContent,
  deleteWebContent,
  updateWebContent,
} = require("../controllers/webcontent.controller");

const fileFields = [
  { name: "landing_image", maxCount: 1 },
  { name: "live_image", maxCount: 1 },
  { name: "live_video", maxCount: 1 },
  ...Array.from({ length: 10 }, (_, i) => ({ name: `org_image_${i}`, maxCount: 1 })),
];

router.post("/publish", upload.fields(fileFields), publishWebContent);
router.put("/update", upload.fields(fileFields), updateWebContent);
router.get("/get", getWebContent);
router.delete("/delete", deleteWebContent);

module.exports = router;
