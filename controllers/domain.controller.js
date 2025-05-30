const axios = require("axios");
const User = require("../models/User.model");
const Webpage = require("../models/WebContent.model");

const NAMESTONE_API_KEY = process.env.NAMESTONE_API_KEY;
const NAMESTONE_API_URL = process.env.NAMESTONE_API_URL;
const ADDRESS = process.env.ADDRESS;
const DOMAIN = process.env.DOMAIN;

const errorResponse = (res, status, message) => res.status(status).json({ message });

exports.publishDomain = async (req, res) => {
  try {
    console.log("[publishDomain] Starting domain publication process");
    const { domain } = req.body;
    console.log("[publishDomain] Received domain request:", domain);

    if (!domain) {
      console.log("[publishDomain] Error: Domain is missing in request");
      return errorResponse(res, 400, "Domain is required.");
    }

    console.log("[publishDomain] Checking for existing domain registration");
    // const existingDomain = await User.findOne({ domain });
    // if (existingDomain) {
    //   console.log("[publishDomain] Error: Domain already registered:", domain);
    //   return errorResponse(res, 400, "Subdomain already registered.");
    // }

    console.log("[publishDomain] Fetching webpage content for user:", req.user._id);
    console.log("[publishDomain] User ID:", req.user.id);
    const webpage = await Webpage.findOne({ user: req.user.id });
    const cid = webpage?.contentHash ?? "";
    
    if (!cid) {
      console.log("[publishDomain] Error: No content hash found for user:", req.user._id);
      return errorResponse(res, 400, "No content hash found. Please publish your webpage first.");
    }
    console.log("[publishDomain] Found content hash:", cid);

    console.log("[publishDomain] Attempting to register subdomain:", domain);
    const isSubdomainRegistered = await registerSubdomain(domain, cid);
    if (!isSubdomainRegistered) {
      console.log("[publishDomain] Error: Failed to register subdomain:", domain);
      return errorResponse(res, 400, "Could not register subdomain.");
    }
    console.log("[publishDomain] Successfully registered subdomain:", domain);

    console.log("[publishDomain] Updating user record with new domain");
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user.id },
      { domain },
      { new: true }
    );
    if (!updatedUser) {
      console.log("[publishDomain] Error: User not found:", req.user.id);
      return errorResponse(res, 404, "User not found.");
    }
    console.log("[publishDomain] Successfully updated user with domain:", domain);

    return res.status(200).json({ domain: updatedUser.domain });
  } catch (error) {
    console.error("[publishDomain] Unexpected error:", error);
    return errorResponse(res, 500, error.message ?? "Failed to publish domain");
  }
};

async function registerSubdomain(subdomain, contenthash) {
  try {
    console.log("[registerSubdomain] Attempting to register subdomain:", subdomain);
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
    console.log("[registerSubdomain] API response status:", response.status);
    return response.status === 200;
  } catch (error) {
    console.error("[registerSubdomain] Error:", error.message);
    return false;
  }
}
