const User = require("../models/User.model");
const SubscriberEmail = require("../models/SubscriberEmail.model");

exports.getUsers = async (req, res) => {
  try {
    const users = await User.aggregate([
      { $match: { password: { $ne: null } } },
      {
        $lookup: {
          from: "web_contents",
          localField: "_id",
          foreignField: "user",
          as: "webContent",
        },
      },
      { $unwind: { path: "$webContent", preserveNullAndEmptyArrays: false } },
      {
        $match: {
          domain: { $exists: true, $ne: null },
          "webContent.landing.image": { $exists: true, $ne: null },
        },
      },
      {
        $project: {
          _id: 1,
          domain: { $concat: ["$domain", ".siher.eth.link"] },
          fullName: "$webContent.landing.fullName",
          image: "$webContent.landing.image",
        },
      },
    ]);

    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.subscribeEmail = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    // Check if email already exists
    const existingSubscriber = await SubscriberEmail.findOne({ email });
    if (existingSubscriber) {
      return res.status(409).json({ message: "Email is already subscribed" });
    }

    // Create new subscriber
    const newSubscriber = new SubscriberEmail({ email });
    await newSubscriber.save();

    return res.status(201).json({ 
      message: "Email subscribed successfully",
      email: email
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
