const express = require("express");
const { v4: uuidv4 } = require("uuid");
const fileUpload = require("express-fileupload");
const Video = require("../models/Video.model");
const { uploadToFileStorage, deleteFromFileStorage } = require("../utils/fileStorage.utils");
const { PINATA_GATEWAY } = require("../consts");

const router = express.Router();

router.post("/", fileUpload(), async (req, res) => {
  const { files, user } = req;
  if (!files?.video) return res.status(400).send("Video is required");

  const file = new File([files.video.data], `${uuidv4()}.${files.video.name}`);
  const videoCid = await uploadToFileStorage(file);

  const video = new Video({ user: user._id, cid: videoCid });
  await video.save();

  const videoUrl = `${PINATA_GATEWAY}/${videoCid}`;
  return res.send({ video: { ...video.toJSON(), videoUrl } });
});

router.get("/", async (req, res) => {
  const { user } = req;
  const { pageNumber, pageSize } = req.query;

  const videosDocs = await Video.find({ user: user._id })
    .skip((pageNumber - 1) * pageSize)
    .limit(pageSize);
  const videos = videosDocs.map((video) => ({
    ...video.toJSON(),
    videoUrl: `${PINATA_GATEWAY}/${video.cid}`,
  }));
  return res.send({ videos });
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;

  const video = await Video.findById(id);
  if (!video) return res.status(404).send("Video not found");

  const videoUrl = `${PINATA_GATEWAY}/${video.cid}`;
  return res.send({ video: { ...video.toJSON(), videoUrl } });
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const video = await Video.findByIdAndDelete(id);
  if (!video) return res.status(404).send("Video not found");

  await deleteFromFileStorage(video.cid);
  return res.send({ video: video.toJSON() });
});

module.exports = router;
