const axios = require("axios");
const User = require("../models/User.model");
const Webpage = require("../models/Webpage.model");

const NAMESTONE_API_KEY = process.env.NAMESTONE_API_KEY;
const NAMESTONE_API_URL = process.env.NAMESTONE_API_URL;
const ADDRESS = process.env.ADDRESS;
const DOMAIN = process.env.DOMAIN;

const errorResponse = (res, status, message) => res.status(status).json({ message });

exports.publishDomain = async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain) {
      return errorResponse(res, 400, "Domain is required.");
    }
    const existingDomain = await User.findOne({ domain });
    if (existingDomain) {
      return errorResponse(res, 400, "Subdomain already registered.");
    }
    const webpage = await Webpage.findOne({ user: req.user._id });
    const cid = webpage?.cid ?? "";
    const isSubdomainRegistered = await registerSubdomain(domain, cid);
    if (!isSubdomainRegistered) {
      return errorResponse(res, 400, "Could not register subdomain.");
    }
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user.id },
      { domain },
      { new: true }
    );
    if (!updatedUser) {
      return errorResponse(res, 404, "User not found.");
    }
    return res.status(200).json({ domain: updatedUser.domain });
  } catch (error) {
    return errorResponse(res, 500, "Internal Server Error.");
  }
};

async function registerSubdomain(subdomain, contenthash) {
  try {
    const response = await axios.post(
      `${NAMESTONE_API_URL}/set-name`,
      {
        domain: DOMAIN,
        address: ADDRESS,
        contenthash: `ipfs://${contenthash}`,
        name: subdomain,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: NAMESTONE_API_KEY,
        },
      }
    );
    return response.status === 200;
  } catch (error) {
    return false;
  }
}
