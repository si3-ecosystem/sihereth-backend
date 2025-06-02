const axios = require("axios");
const User = require("../models/User.model");
const Webpage = require("../models/WebContent.model");
const NAMESTONE_API_KEY = process.env.NAMESTONE_API_KEY;
const NAMESTONE_API_URL = process.env.NAMESTONE_API_URL;
const ADDRESS = process.env.ADDRESS;
const DOMAIN = process.env.DOMAIN;

const errorResponse = (res, status, message) => res.status(status).json({ message });

const publishDomain = async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain) {
      return errorResponse(res, 400, "Domain is required.");
    }
    // const existingDomain = await User.findOne({ domain: { $exists: true, $ne: null } });
    // if (existingDomain) {
    //   return errorResponse(res, 400, "Subdomain already registered.");
    // }
    const webpage = await Webpage.findOne({ user: req.user.id });
    const cid = webpage?.contentHash ?? "";
    if (!cid) {
      return errorResponse(res, 400, "No content hash found. Please publish your webpage first.");
    }
    const isSubdomainRegistered = await registerSubdomain(domain, cid);
    if (!isSubdomainRegistered) {
      return errorResponse(res, 400, "Could not register subdomain.");
    }
    // const updatedUser = await User.findOneAndUpdate(
    //   { _id: req.user.id },
    //   { domain },
    //   { new: true }
    // );
    // if (!updatedUser) {
    //   return errorResponse(res, 404, "User not found.");
    // }
    return res.status(200).json({
      // domain: updatedUser.domain
      message: "Domain registered successfully",
    });
  } catch (error) {
    console.error("[Domain] Error in publishDomain:", {
      error: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status
    });
    return errorResponse(res, 500, error.message ?? "Failed to publish domain");
  }
};

const registerSubdomain = async (subdomain, contenthash) => {
  try {
    console.log("[Domain] Starting subdomain registration:", {
      subdomain,
      contenthash,
      apiUrl: NAMESTONE_API_URL,
      domain: DOMAIN,
      hasApiKey: !!NAMESTONE_API_KEY,
      hasAddress: !!ADDRESS
    });

    if (!NAMESTONE_API_URL || !NAMESTONE_API_KEY || !ADDRESS || !DOMAIN) {
      console.error("[Domain] Missing required environment variables:", {
        hasApiUrl: !!NAMESTONE_API_URL,
        hasApiKey: !!NAMESTONE_API_KEY,
        hasAddress: !!ADDRESS,
        hasDomain: !!DOMAIN
      });
      throw new Error("Missing required environment variables for domain registration");
    }

    const payload = {
      domain: DOMAIN,
      address: ADDRESS,
      contenthash: `ipfs://${contenthash}`,
      name: subdomain,
    };

    console.log("[Domain] Sending request to Namestone API:", {
      url: NAMESTONE_API_URL,
      payload: { ...payload, contenthash: `ipfs://${contenthash}` }
    });

    const response = await axios.post(
      NAMESTONE_API_URL,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: NAMESTONE_API_KEY,
        },
      }
    );

    console.log("[Domain] Namestone API response:", {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });

    return response.status === 200;
  } catch (error) {
    console.error("[Domain] Error in registerSubdomain:", {
      error: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: {
          ...error.config?.headers,
          Authorization: error.config?.headers?.Authorization ? '[REDACTED]' : undefined
        }
      }
    });

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      throw new Error(`Namestone API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error(`No response from Namestone API: ${error.message}`);
    } else {
      // Something happened in setting up the request that triggered an Error
      throw new Error(`Request setup error: ${error.message}`);
    }
  }
};

module.exports = { publishDomain, registerSubdomain };
