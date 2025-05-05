const User = require("../models/User.model");
const WebContent = require("../models/WebContent.model");

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
      { $unwind: { path: "$webContent", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          domain: 1,
          fullName: "$webContent.landing.fullName",
          image: "$webContent.landing.image",
        },
      },
    ]);
    return res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
