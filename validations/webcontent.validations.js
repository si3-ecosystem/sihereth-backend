const Joi = require("joi");

const detailSchema = Joi.object({
  title: Joi.string().required(),
  heading: Joi.string().required(),
  body: Joi.string().required(),
});

const timelineItemSchema = Joi.object({
  title: Joi.string().required(),
  to: Joi.string().allow(""),
  from: Joi.string().required(),
});

const socialChannelSchema = Joi.object({
  text: Joi.string().required(),
  url: Joi.string().allow(""),
});

const landingSchema = Joi.object({
  name: Joi.string(),
  title: Joi.string(),
  headline: Joi.string(),
  hashTags: Joi.array().items(Joi.string()),
  region: Joi.string(),
  organizationAffiliations: Joi.array().items(Joi.string()),
  communityAffiliations: Joi.array().items(Joi.string()),
  superPowers: Joi.array().items(Joi.string()),
  image: Joi.string(),
  fullName: Joi.string(),
  pronoun: Joi.string(),
});

const validateWebContent = (content) => {
  const schema = Joi.object({
    landing: landingSchema.required(),
    slider: Joi.array().items(Joi.string()).required(),
    value: Joi.object({
      experience: Joi.string(),
      values: Joi.string(),
    }).required(),
    live: Joi.object({
      image: Joi.string(),
      video: Joi.string(),
      details: Joi.array().items(detailSchema),
    }).required(),
    organizations: Joi.array().items(Joi.string()).required(),
    timeline: Joi.array().items(timelineItemSchema).required(),
    available: Joi.object({
      avatar: Joi.string(),
      availableFor: Joi.array().items(Joi.string()),
    }).required(),
    socialChannels: Joi.array().items(socialChannelSchema).required(),
    isNewWebpage: Joi.boolean(),
  });

  const { error } = schema.validate(content);
  return error ? error.details[0].message : null;
};

// Helper to validate content structure
const validateContentStructure = (content) => {
  if (!content || typeof content !== "object") return false;
  const requiredSections = [
    "landing",
    "slider",
    "value",
    "live",
    "organizations",
    "timeline",
    "available",
    "socialChannels",
  ];
  return requiredSections.every((section) => content[section] !== undefined);
};

module.exports = {
  validateWebContent,
  validateContentStructure,
};
