const { v4: uuidv4 } = require("uuid");
const Image = require("../models/Image.model");
const { uploadToFileStorage, deleteFromFileStorage } = require("../utils/fileStorage.utils");
const { PINATA_GATEWAY } = require("../consts");

exports.uploadImage = async (req, res) => {
  try {
    const { files, user } = req;
    if (!files?.image) return res.status(400).send("Image is required");

    const file = new File([files.image.data], `${uuidv4()}.${files.image.name}`);
    const imageCid = await uploadToFileStorage(file);

    if (!imageCid) return res.status(400).send("Could not upload Image");

    const image = new Image({ user: user.id, cid: imageCid });
    await image.save();

    const imageUrl = `${PINATA_GATEWAY}/${imageCid}`;
    return res.send({ image: { ...image.toJSON(), imageUrl } });
  } catch (error) {
    console.error("Upload image error:", error);
    return res.status(500).send("Error uploading image");
  }
};

exports.getImages = async (req, res) => {
  try {
    const { user } = req;
    const { pageNumber, pageSize } = req.query;

    const imagesDocs = await Image.find({ user: user.id })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);

    const images = imagesDocs.map((image) => ({
      ...image.toJSON(),
      imageUrl: `${PINATA_GATEWAY}/${image.cid}`,
    }));
    return res.send({ images });
  } catch (error) {
    console.error("Get images error:", error);
    return res.status(500).send("Error fetching images");
  }
};

exports.getImageById = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await Image.findById(id);
    if (!image) return res.status(404).send("Image not found");

    const imageUrl = `${PINATA_GATEWAY}/${image.cid}`;
    return res.send({ image: { ...image.toJSON(), imageUrl } });
  } catch (error) {
    console.error("Get image by id error:", error);
    return res.status(500).send("Error fetching image");
  }
};

exports.deleteImage = async (req, res) => {
  try {
    const { id } = req.params;

    const image = await Image.findByIdAndDelete(id);
    if (!image) return res.status(404).send("Image not found");

    await deleteFromFileStorage(image.cid);
    return res.send({ image: image.toJSON() });
  } catch (error) {
    console.error("Delete image error:", error);
    return res.status(500).send("Error deleting image");
  }
};
