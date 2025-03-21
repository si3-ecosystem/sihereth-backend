const User = require("../models/User.model");
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ password: { $ne: null } }).select(
      "name firstName lastName email"
    );
    return res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// domain: { $ne: null }
