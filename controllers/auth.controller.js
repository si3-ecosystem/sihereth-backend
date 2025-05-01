const crypto = require("crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const { sendMail } = require("../utils/mailer");

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
      { expiresIn: "2d" }
    );
    const userData = {
      id: user._id,
      email: user.email ?? "",
      name: user.name ?? "",
      domain: user.domain ?? "",
      token,
    };
    return res.status(200).json({
      message: "Login successful",
      user: userData,
    });
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return errorResponse(res, 400, "Email is required");
    const user = await User.findOne({ email });
    if (!user) return errorResponse(res, 404, "User not found");
    const token = crypto.randomBytes(20).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    user.otp = hashedToken;
    await user.save();
    await sendMail({
      to: email,
      subject: "Password Reset Link",
      text: `Your OTP for passwor reset ${token}`,
    });
    return res.status(200).json({ message: "Password reset link sent successfully" });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset Password
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token } = req.query;
    const { password } = req.body;
    if (!token || !password) return errorResponse(res, 400, "Token and new password are required");

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({ otp: hashedToken });
    if (!user) return errorResponse(res, 400, "Invalid or expired token");

    user.password = password;
    user.otp = null;
    await user.save();

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    next(error);
  }
};
