const express = require("express");
const crypto = require("crypto");
const User = require("../models/User.model");
const {
  validateResetPassword,
  validateForgotPassword,
} = require("../validations/user.validations");
const { encryptPassword, comparePassword } = require("../utils/password.utils");
const { generateAuthToken } = require("../utils/auth.utils");
const { senderEmailService } = require("../utils/email.utils");

const router = express.Router();

router.get("/approve", async (req, res) => {
  const { email } = req.query;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (user) return res.send("User already created");
  const newUser = new User({ email: email.toLowerCase() });
  await newUser.save();
  return res.send("User successfully Approved");
});

router.post("/", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(400).send("Invalid email or Password");
  if (!user.password) {
    const updatedUser = await User.findOneAndUpdate(
      {
        email: email.toLowerCase(),
      },
      {
        password: await encryptPassword(password),
      }
    );
    const token = generateAuthToken({
      ...updatedUser.toJSON(),
      password: undefined,
    });
    return res.send({ token });
  }

  const isPasswordCorrect = await comparePassword(password, user.password);
  if (!isPasswordCorrect) return res.status(400).send("Invalid email or Password");

  const token = generateAuthToken({
    ...user.toJSON(),
    password: undefined,
    resetPasswordToken: undefined,
  });
  return res.send({ token });
});

router.post("/forgot-password", async (req, res) => {
  console.log("Incoming request for forgot-password:", req.body);
  try {
    const { body } = req;
    // ✅ Validate input
    const error = validateForgotPassword(body);
    if (error) {
      console.warn("Validation failed:", error);
      return res.status(400).json({ error });
    }
    // ✅ Generate reset token
    const token = crypto.randomBytes(20).toString("hex");
    console.log("Generated reset token:", token);
    // ✅ Find and update user
    const user = await User.findOneAndUpdate(
      { email: body.email },
      { resetPasswordToken: token },
      { new: true } // Return updated document
    );
    if (!user) {
      console.warn("User not found:", body.email);
      return res.status(404).json({ error: "User not found" });
    }
    console.log("User found, sending email to:", body.email);
    // ✅ Send reset link
    await senderEmailService(
      body.email,
      "Password Reset Link",
      `https://siher.si3.space/auth/reset-password?token=${token}`
    );
    console.log("Password reset link sent successfully to:", body.email);
    return res.status(200).json({ message: "Password Reset link was sent" });
  } catch (error) {
    console.error("Error in forgot-password route:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/reset-password", async (req, res) => {
  const { token } = req.query;
  const { body } = req;

  const error = validateResetPassword(body);
  if (error) return res.status(400).send(error);

  const password = await encryptPassword(body.password);

  const user = await User.findOneAndUpdate(
    { resetPasswordToken: token },
    { password, resetPasswordToken: null }
  );

  if (!user) return res.status(400).send("Could not update the user password");

  return res.send("Password reset Successsfully!");
});

module.exports = router;
