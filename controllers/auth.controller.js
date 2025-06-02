const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const WebContent = require("../models/WebContent.model");

const errorResponse = (res, status, message) => res.status(status).json({ message: message });

exports.approveUser = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) return errorResponse(res, 400, "Email is required");
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return errorResponse(res, 400, "Invalid email format");
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return errorResponse(res, 409, "User already exists");
    const newUser = new User({ email: email.toLowerCase() });
    await newUser.save();
    return res.status(201).json({ message: "User successfully approved" });
  } catch (error) {
    next(error);
  }
};

exports.loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return errorResponse(res, 400, "Email and password are required");
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return errorResponse(res, 404, "User does not exist");
    if (!user.password) {
      user.password = password;
      await user.save();
    }
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return errorResponse(res, 403, "Incorrect password");
    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "3d" }
    );
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });
    const webContent = await WebContent.findOne({ user: user._id });
    const userData = {
      id: user._id,
      email: user.email ?? "",
      domain: user.domain ?? "",
      webContent: webContent ?? null,
    };
    return res.status(200).json({
      message: "Login successful",
      user: userData,
    });
  } catch (error) {
    next(error);
  }
};
