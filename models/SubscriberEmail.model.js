const mongoose = require("mongoose");

const SubscriberEmailSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const SubscriberEmail = mongoose.model(
  "SubscriberEmail",
  SubscriberEmailSchema
);
module.exports = SubscriberEmail;
