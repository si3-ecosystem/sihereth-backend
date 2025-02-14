const express = require("express");
const auth = require("../middlewares/auth.middleware");
const Webpage = require("../models/Webpage.model");
const { registerSubdomain } = require("../utils/namestone.util");

const blackListedDomains = process.env.DOMAIN_BLACK_LIST?.split(",");

const router = express.Router();

router.post("/", auth, async (req, res) => {
  try {
    console.log("Received request to register subdomain:", req.body);

    // Use camelCase to match frontend
    const { subDomain } = req.body;
    console.log("subDomain:", subDomain);

    // Check if subDomain is blacklisted
    if (blackListedDomains?.includes(subDomain)) {
      console.warn(`Subdomain "${subDomain}" is blacklisted`);
      return res.status(400).send("Subdomain is blacklisted");
    }

    // Check if subDomain is already registered
    const subdomainRegistered = await Webpage.findOne({ subdomain: subDomain });
    if (subdomainRegistered) {
      console.warn(`Subdomain "${subDomain}" is already registered`);
      return res.status(400).send("Subdomain Already registered");
    }

    // Check if user has a webpage
    let webpage = await Webpage.findOne({ user: req.user._id });
    if (!webpage) {
      console.error(`Webpage not found for user: ${req.user._id}`);
      return res.status(404).send("Webpage not found");
    }

    console.log(`Registering subdomain "${subDomain}" for CID: ${webpage.cid}`);

    // Attempt to register subdomain
    const isSubdomainRegistered = await registerSubdomain(subDomain, webpage.cid);
    if (!isSubdomainRegistered) {
      console.error(`Failed to register subdomain "${subDomain}"`);
      return res.status(400).send("Could not register subdomain");
    }

    // Update webpage with new subdomain
    webpage = await Webpage.findOneAndUpdate(
      { user: req.user._id },
      { subdomain: subDomain },
      { new: true }
    );

    console.log(`Subdomain "${subDomain}" successfully registered for user: ${req.user._id}`);
    return res.status(200).send({ webpage });
  } catch (error) {
    console.error("Error in subdomain registration:", error);
    return res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
