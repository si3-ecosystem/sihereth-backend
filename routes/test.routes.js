const express = require("express");
const fs = require("node:fs");
const ejs = require("ejs");
const path = require("node:path");
const auth = require("../middlewares/auth");
const router = express.Router();

router.get("/render", auth, (req, res) => {
  try {
    const content = {
      landing: {
        fullName: "Ali",
        title: "Backend Developer",
        headline: "& I develop web apps.",
        hashTags: ["Koders", "New tag"],
        region: "Southeastern Asia",
        organizationAffiliations: ["Devs", "Hackers", "Community"],
        communityAffiliations: ["Coders, Hackers, Community Builders"],
        superPowers: ["Developing", "Teaching", "Community"],
        image:
          "https://res.cloudinary.com/dv52zu7pu/image/upload/v1751386821/girl_ainxhw.png",
        pronoun: "he/him",
      },
      slider: ["Node", "Nest", "DevOps"],
      value: {
        experience:
          "My career began in 2020 at Graana. I started an internship in web development.",
        values:
          "Grow and become a skilled developer, excel in DevOps, and be a good mentor.",
      },
      live: {
        image:
          "https://res.cloudinary.com/dq033xs8n/image/upload/v1748804464/vnaidlylf4ferys1nwc3.jpg",
        url: "https://res.cloudinary.com/dq033xs8n/video/upload/v1744345277/vid_cy6pec.mp4",
        walletUrl:
          "https://pb.aurpay.net/pb/page/html/paymentbutton.html?token=pb_plugin_link_token_h6hzBGgZzFW1G5eO",
        details: [
          { title: "website", heading: "zain.com" },
          { title: "facebook", heading: "zas512" },
          { title: "instagram", heading: "z.a.i.n" },
        ],
      },
      organizations: [
        {
          src: "https://res.cloudinary.com/dq033xs8n/image/upload/v1748798333/ssjfnrdqnrnypxgiqflq.jpg",
        },
        {
          src: "https://res.cloudinary.com/dq033xs8n/image/upload/v1748798342/ktgfunqrklosfj2tmbln.png",
        },
      ],
      timeline: [
        { title: "Full stack developer at WJIKS", to: "PRESENT", from: "2022" },
        { title: "Developer at graana", to: "2022", from: "2020" },
        { title: "Freelance developer", to: "PRESENT", from: "2020" },
        { title: "Developer", to: "PRESENT", from: "2025" },
      ],
      available: {
        avatar:
          "https://res.cloudinary.com/dq033xs8n/image/upload/v1748804165/lfut09lovn42dupgnnmc.jpg",
        availableFor: ["Developing", "Coding"],
        ctaUrl: "https://www.si3.space",
        ctaText: "Join SI<3>",
      },
      socialChannels: [
        {
          url: "https://www.linkedin.com",
          icon: "https://res.cloudinary.com/dq033xs8n/image/upload/v1746343757/Facebook_bsmqay.svg",
        },
        {
          url: "https://www.instagram.com",
          icon: "https://res.cloudinary.com/dq033xs8n/image/upload/v1746343757/Instagram_lyhjoi.svg",
        },
        {
          url: "https://twitter.com",
          icon: "https://res.cloudinary.com/dq033xs8n/image/upload/v1746344739/Twitter_geucw3.svg",
        },
      ],
    };

    // --- 1. Template Rendering & Verification ---
    const templateFile = fs.readFileSync(
      path.join(__dirname, "../template/index.ejs"),
      "utf-8"
    );
    const template = ejs.compile(templateFile);
    const renderedTemplate = template(content);

    // **✅ POST-RENDERING CHECK**
    if (!renderedTemplate || !renderedTemplate.includes("<html")) {
      throw new Error(
        "Render check failed: Template produced empty or invalid output."
      );
    }
    console.log("[Render Route] Template rendered successfully.");

    // --- 2. File Saving & Verification ---
    const filename = `${content.landing.fullName.replace(/\s+/g, "-")}.html`;
    const tempDir = path.join(__dirname, "../temp");
    const filePath = path.join(tempDir, filename);

    // Ensure the temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    fs.writeFileSync(filePath, renderedTemplate);
    console.log(
      `[Render Route] File write operation completed for ${filePath}`
    );

    // **✅ POST-SAVE VERIFICATION CHECK**
    const savedFileContent = fs.readFileSync(filePath, "utf-8");
    if (savedFileContent !== renderedTemplate) {
      throw new Error(
        "Save verification failed: The content on disk does not match the rendered content."
      );
    }
    console.log("[Render Route] File save verified successfully.");

    return res.status(200).json({
      message: "Template rendered and saved successfully",
      filename,
      path: filePath,
    });
  } catch (error) {
    console.error("Error in /render route:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

module.exports = router;
