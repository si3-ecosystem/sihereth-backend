const Joi = require("joi");
const { validate } = require(".");

const createWebpageSchema = Joi.object({
  navbar: Joi.object({
    websiteName: Joi.string().required().label("Website Name"),
    links: Joi.array()
      .items(Joi.string().required())
      .required()
      .min(1)
      .label("Links"),
  }),
  landing: Joi.object({
    title: Joi.string().required().label("Title"),
    subTitle: Joi.string().required().label("Subtitle"),
    hashTagTitle: Joi.string().required().label("Hashtag Title"),
    hashTags: Joi.array()
      .items(Joi.string().required())
      .required()
      .min(1)
      .label("Hastags"),
    categories: Joi.object({
      region: Joi.string().required().label("Region"),
      superPower: Joi.array().items(Joi.string().required()),
      organizationAffiliations: Joi.array()
        .items(Joi.string().required())
        .label("Organization Affiliations"),
      communityAffiliations: Joi.array()
        .items(Joi.string().required())
        .label("Community Affiliations"),
    })
      .required()
      .label("Categories"),
    userimg: Joi.object({
      path: Joi.string().required().label("User image path"),
      id: Joi.alternatives(Joi.string().allow(null)).label("User image id"),
    }),
    name: Joi.string().required().label("Name"),
    pronoun: Joi.string().required().label("Pronoun"),
  }),
  value: Joi.object({
    title: Joi.string().required().label("Value Title"),
    description: Joi.string().required().label("Value Description"),
    TVName: Joi.string().required().label("TV Name"),
    video: Joi.object({
      path: Joi.string().required().label("Video path"),
      id: Joi.alternatives(Joi.string().allow(null), Joi.allow(null)).label(
        "Video id"
      ),
    }).label("Video Object"),
    links: Joi.array()
      .items({
        title: Joi.string().required().label("Link Title"),
        type: Joi.string().required().label("Type"),
        link: Joi.string().uri().required().label("Link"),
      })
      .required()
      .min(1),
    text: "TIP IN CRYPTO",
    button: Joi.object({
      text: Joi.string().required().label("Button Text"),
      link: Joi.string().uri().required().label("Button Link"),
    }).required(),
  }),
  vision: Joi.object({
    title: Joi.string().required().label("Vision Title"),
    description: Joi.string().required().label("Vision Description"),
  }),
  CV: Joi.object({
    past: Joi.object({
      title: Joi.string().required().label("CV Title"),
      highlights: Joi.array().items(
        Joi.object({
          year: Joi.string().required().label("Highlights year"),
          text: Joi.string().required().label("Highlights Text"),
        }).required()
      ),
    })
      .required()
      .label("Present"),
    present: Joi.object({
      title: Joi.string().required().label("Past Title"),
      highlights: Joi.array().items(Joi.string().required()),
    })
      .required()
      .label("Past"),
    future: Joi.object({
      title: Joi.string().required().label("Future Title"),
      text: Joi.string().required().label("Future Text"),
    })
      .required()
      .label("Future"),
  }),
  available: Joi.object({
    title: Joi.string().required().label("Title"),
    marque: Joi.array().items(
      Joi.object({
        heading: Joi.string().required().label("Heading"),
      })
    ),
    socialChannels: Joi.array()
      .items(
        Joi.object({
          text: Joi.string().required().label("Text"),
          url: Joi.string().required().label("Url"),
        })
      )
      .required()
      .label("Social Channels"),
  }),
});

function validateCreateWebpage(data) {
  return validate(data, createWebpageSchema);
}

module.exports = {
  validateCreateWebpage,
};

