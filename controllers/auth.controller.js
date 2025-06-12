const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const WebContent = require("../models/WebContent.model");

const errorResponse = (res, status, message) => res.status(status).json({ message: message });

exports.approveUser = async (req, res) => {
  try {
    console.log("[Auth] Starting user approval process");
    const { email } = req.query;
    
    if (!email) {
      console.log("[Auth] Missing email in approval request");
      return errorResponse(res, 400, "Email is required");
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      console.log("[Auth] Invalid email format:", email);
      return errorResponse(res, 400, "Invalid email format");
    }

    console.log("[Auth] Checking for existing user with email:", email);
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log("[Auth] User already exists:", email);
      return errorResponse(res, 409, "User already exists");
    }

    console.log("[Auth] Creating new user for email:", email);
    const newUser = new User({
      email: email.toLowerCase(),
      password: null // Explicitly set password to null to avoid hashing
    });

    try {
      await newUser.save();
      console.log("[Auth] Successfully created new user:", email);
      return res.status(201).json({ 
        message: "User successfully approved",
        email: newUser.email
      });
    } catch (saveError) {
      console.error("[Auth] Error saving new user:", {
        error: saveError.message,
        code: saveError.code,
        email
      });
      return errorResponse(res, 500, "Failed to create user");
    }
  } catch (error) {
    console.error("[Auth] Unexpected error in approveUser:", {
      error: error.message,
      stack: error.stack
    });
    return errorResponse(res, 500, "Internal server error");
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
