const mongoose = require("mongoose");

const Webpage = mongoose.model(
  "Webpage",
  new mongoose.Schema({
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cid: { type: String, required: true },
    subdomain: String,
    data: {
      type: {
        _id: false,
        navbar: {
          websiteName: { type: String, required: true },
          links: [
            {
              type: String,
              required: true,
            },
          ],
        },
        landing: {
          title: { type: String, required: true },
          subTitle: { type: String, required: true },
          hashTagTitle: { type: String, required: true },
          hashTags: [
            {
              type: String,
              required: true,
            },
          ],
          categories: {
            _id: false,
            type: {
              region: { type: String, required: true },
              superPower: [
                {
                  type: String,
                },
              ],
              organizationAffiliations: [{ type: String }],
              communityAffiliations: [{ type: String }],
            },
            required: true,
          },
          userimg: {
            path: { type: String, required: true },
            id: { type: String },
          },
          name: { type: String, required: true },
          pronoun: { type: String, required: true },
        },
        value: {
          title: { type: String, required: true },
          description: { type: String, required: true },
          TVName: { type: String, required: true },
          video: {
            path: { type: String, required: true },
            id: { type: String },
          },
          links: [
            {
              title: { type: String, required: true },
              type: { type: String, required: true },
              link: { type: String, required: true },
              _id: false,
            },
          ],
          button: {
            type: {
              text: { type: String, required: true },
              link: { type: String, required: true },
            },
            required: true,
            _id: false,
          },
        },
        vision: {
          title: { type: String, required: true },
          description: { type: String, required: true },
        },
        CV: {
          past: {
            title: { type: String, required: true },
            highlights: [
              {
                type: {
                  year: { type: String, required: true },
                  text: { type: String, required: true },
                  _id: false,
                },
                required: true,
              },
            ],
          },
          present: {
            type: {
              title: { type: String, required: true },
              highlights: [{ type: String, required: true }],
              _id: false,
            },
            required: true,
          },
          future: {
            type: {
              title: { type: String, required: true },
              text: { type: String, required: true },
              _id: false,
            },
            required: true,
          },
        },
        available: {
          title: { type: String, required: true },
          marque: [
            {
              heading: { type: String, required: true },
              _id: false,
            },
          ],
          socialChannels: [
            {
              _id: false,
              text: { type: String, required: true },
              url: { type: String, required: true },
            },
          ],
        },
      },
      required: true,
    },
  })
);

module.exports = Webpage;

