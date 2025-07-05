const axios = require("axios");
const User = require("../models/User.model");
const Webpage = require("../models/WebContent.model");
const NAMESTONE_API_KEY = process.env.NAMESTONE_API_KEY;
const NAMESTONE_API_URL = process.env.NAMESTONE_API_URL;
const ADDRESS = process.env.ADDRESS;
const DOMAIN = process.env.DOMAIN;

const errorResponse = (res, status, message) =>
  res.status(status).json({ message });

const publishDomain = async (req, res) => {
  try {
    const { domain } = req.body;

    if (!domain) {
      return errorResponse(res, 400, "Domain is required.");
    }

    const existingDomain = await User.findOne({ domain: domain });

    if (existingDomain == domain) {
      return errorResponse(res, 400, "Subdomain already registered.");
    }

    const webpage = await Webpage.findOne({ user: req.user.id });
    const cid = webpage?.contentHash ?? "";
    if (!cid) {
      console.log(
        "[publishDomain] No content hash found for user:",
        req.user.id
      );
      return errorResponse(
        res,
        400,
        "Before selecting your domain name, please publish your webpage first."
      );
    }

    const isSubdomainRegistered = await registerSubdomain(domain, cid);
    if (!isSubdomainRegistered) {
      return errorResponse(res, 400, "Could not register subdomain.");
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user.id },
      { domain: domain },
      { new: true }
    );

    if (!updatedUser) {
      return errorResponse(res, 404, "User not found.");
    }
    return res
      .status(200)
      .json({ domain: `${updatedUser?.domain}.siher.eth.link` });
  } catch (error) {
    console.error("[publishDomain] Error:", error);
    return errorResponse(res, 500, error.message ?? "Failed to publish domain");
  }
};

const registerSubdomain = async (subdomain, contenthash) => {
  try {
    console.log(
      "[registerSubdomain] Registering subdomain:",
      subdomain,
      "with contenthash:",
      contenthash
    );
    const response = await axios.post(
      NAMESTONE_API_URL,
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
    console.log("[registerSubdomain] API response status:", response.status);
    return response.status === 200;
  } catch (err) {
    console.error(
      "[registerSubdomain] Error registering subdomain:",
      err.response?.data || err.message
    );
    return false;
  }
};

module.exports = { publishDomain, registerSubdomain };
