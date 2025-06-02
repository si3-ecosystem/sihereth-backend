const mongoose = require("mongoose");

const webContentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    contentHash: { type: String },
    landing: {
      fullName: { type: String },
      title: { type: String },
      headline: { type: String },
      hashTags: [{ type: String }],
      region: { type: String },
      organizationAffiliations: [{ type: String }],
      communityAffiliations: [{ type: String }],
      superPowers: [{ type: String }],
      image: { type: String },
      pronoun: { type: String },
    },
    slider: [{ type: String }],
    value: {
      experience: { type: String },
      values: { type: String },
    },
    live: {
      image: { type: String },
      video: { type: String },
      url: { type: String },
      walletUrl: { type: String },
      details: [
        {
          title: { type: String },
          heading: { type: String },
          body: { type: String },
        },
      ],
    },
    organizations: [{ type: String }],
    timeline: [
      {
        title: { type: String },
        to: { type: String },
        from: { type: String },
      },
    ],
    available: {
      avatar: { type: String },
      availableFor: [{ type: String }],
      ctaUrl: { type: String },
      ctaText: { type: String },
    },
    socialChannels: [
      {
        text: { type: String },
        url: { type: String },
        icon: { type: String },
      },
    ],
    isNewWebpage: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "web_contents",
  }
);

const WebContent = mongoose.model("WebContent", webContentSchema);

module.exports = WebContent;
