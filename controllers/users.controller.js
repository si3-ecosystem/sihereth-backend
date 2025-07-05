const User = require("../models/User.model");

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
