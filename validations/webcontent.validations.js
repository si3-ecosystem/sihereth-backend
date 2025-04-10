const Joi = require("joi");

const webContentValidationSchema = Joi.object({
  user: Joi.string().required(),
  landing: Joi.object({
    name: Joi.string().required(),
    title: Joi.string().required(),
    headline: Joi.string().required(),
    hashTags: Joi.array().items(Joi.string()),
    region: Joi.string().required(),
    organizationAffiliations: Joi.array().items(Joi.string()),
    communityAffiliations: Joi.array().items(Joi.string()),
    superPowers: Joi.array().items(Joi.string()),
    image: Joi.string().uri(),
    fullName: Joi.string(),
    pronoun: Joi.string(),
  }).required(),
  slider: Joi.array().items(Joi.string()),
  value: Joi.object({
    experience: Joi.string(),
    values: Joi.string(),
  }),
  live: Joi.object({
    image: Joi.string().uri(),
    video: Joi.string().uri(),
    details: Joi.array().items(
      Joi.object({
        title: Joi.string(),
        heading: Joi.string(),
        body: Joi.string(),
      })
    ),
  }),
  organizations: Joi.array().items(Joi.string()),
  timeline: Joi.array().items(
    Joi.object({
      title: Joi.string().required(),
      from: Joi.string(),
      to: Joi.string().allow(""),
    })
  ),
  available: Joi.object({
    avatar: Joi.string().uri().required(),
    availableFor: Joi.array().items(Joi.string()).required(),
  }),
  socialChannels: Joi.array().items(
    Joi.object({
      text: Joi.string().required(),
      url: Joi.string().uri().allow("").required(),
    })
  ),
  isNewWebpage: Joi.boolean().default(true),
});

module.exports = {
  webContentValidationSchema,
};
