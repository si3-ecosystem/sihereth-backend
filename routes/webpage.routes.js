const express = require("express");
const fs = require("fs");
const ejs = require("ejs");
const { v4: uuidv4 } = require("uuid");

const { validateCreateWebpage } = require("../validations/webpage.validations");
const Webpage = require("../models/Webpage.model");
const {
  uploadToFileStorage,
  deleteFromFileStorage,
} = require("../utils/fileStorage.utils");
const { registerSubdomain } = require("../utils/namestone.util");
const { PINATA_GATEWAY } = require("../consts");

const router = express.Router();

router.post("/", async (req, res) => {
  const { body, user } = req;

  // const error = validateCreateWebpage(body);
  // if (error) return res.status(400).send(error);
  const dbWebpage = await Webpage.findOne({ user: user.id });
  if (dbWebpage) return res.status(400).send("Webpage already exists");

  const templateFile = fs.readFileSync(`${__dirname}/../template/index.ejs`);

  const template = ejs.compile(templateFile.toString());
  const renderedTemplate = template(body.content);

  const fileBlob = new Blob([renderedTemplate], { type: "text/html" });
  const file = new File([fileBlob], `${uuidv4()}.html`, {
    type: "text/html",
  });

  const cid = await uploadToFileStorage(file);

  const webpage = new Webpage({
    user: user.id,
    cid,
    data: body.content,
    subdomain: body.subdomain,
  });
  await webpage.save();

  return res.send({
    ...webpage.toJSON(),
    url: `${PINATA_GATEWAY}/${webpage.cid}`,
  });
});

router.get("/", async (req, res) => {
  try {
    const { user } = req;
    console.log(user);
    const webpage = await Webpage.findOne({ user: user.id });

    if (!webpage) {
      return res.status(404).json({ message: "Webpage not found" });
    }
    return res.send({
      url: `${PINATA_GATEWAY}/${webpage?.cid}`,
      ...webpage?.toJSON(),
    });
  } catch (error) {
    console.log(error);
    return res.send({ url: "Server error.Please refresh the page" });
  }
});

router.put("/", async (req, res) => {
  const { user, body } = req;

  // const error = validateCreateWebpage(body);
  // if (error) return res.status(400).send(error);

  const dbWebpage = await Webpage.findOne({ user: user.id });
  if (!dbWebpage) return res.status(404).send("Webpage not found");

  const { cid } = dbWebpage;
  await deleteFromFileStorage(cid);

  const templateFile = fs.readFileSync(`${__dirname}/../template/index.ejs`);

  const template = ejs.compile(templateFile.toString());
  const renderedTemplate = template(body.content);

  const fileBlob = new Blob([renderedTemplate], { type: "text/html" });
  const file = new File([fileBlob], `${uuidv4()}.html`, {
    type: "text/html",
  });

  const newCid = await uploadToFileStorage(file);

  const webpage = await Webpage.findByIdAndUpdate(
    dbWebpage._id,
    {
      cid: newCid,
      data: body.content,
    },
    { new: true }
  );
  await webpage.save();

  if (webpage.subdomain) {
    await registerSubdomain(webpage.subdomain, newCid);
  }

  return res.send({
    url: `${PINATA_GATEWAY}/${webpage?.cid}`,
    ...webpage?.toJSON(),
  });
});

router.delete("/", async (req, res) => {
  const { user } = req;

  const webpage = await Webpage.findOne({ user: user._id });
  if (!webpage) return res.status(404).send("Webpage not found");

  const { cid } = webpage;
  await deleteFromFileStorage(cid);

  await Webpage.findByIdAndDelete(webpage._id);

  return res.send({ webpage });
});

module.exports = router;
