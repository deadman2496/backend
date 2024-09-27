// Import the Express framework
import express from "express";

// Import bcryptjs for password hashing and comparison
import bcrypt from "bcryptjs";

// Import the Mongoose library for MongoDB
import mongoose from "mongoose";

// Destructure the compare function from bcrypt
const { compare } = bcrypt;

// Import the user model
import UserModel from "../../models/users.js";

// Import utility functions for authentication
import { setAuthCookies, generateAuthToken } from "../../utils/authUtils.js";

// Create a new Express router
const router = express.Router();

// Route for user signup
router.post("/signup", async (request, response) => {
  try {
    const { name, email, password } = request.body;

    const userExists = await UserModel.findOne({ email });

    if (userExists) {
      return response
        .status(409)
        .json({ success: false, error: "User already exists" });
    }

    const newUser = await UserModel.create({
      name,
      email,
      password,
    });

    console.log("New user created successfully");

    response.status(200).json({ success: true, message: "Signup successful" });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      for (let field in error.errors) {
        const message = error.errors[field].message;
        return response.status(400).json({ success: false, message });
      }
    }

    console.error(error);
    response
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
});

// Route for user login
router.post("/login", async (request, response) => {
  try {
    const { email, password } = request.body;

    if (!email || !password) {
      return response
        .status(400)
        .json({ success: false, error: "Email and password are required" });
    }

    const user = await UserModel.findOne({ email }).select("+password");

    if (!user) {
      return response
        .status(404)
        .json({ success: false, error: "User not found" });
    }

    const isPasswordCorrect = await compare(password, user.password);

    if (!isPasswordCorrect) {
      return response
        .status(401)
        .json({ success: false, error: "Incorrect password" });
    }

    const authToken = generateAuthToken(user._id);

    setAuthCookies(response, authToken);

    response.status(200).json({
      success: true,
      message: "Login successful",
      token: authToken,
      user: { user },
    });
  } catch (error) {
    console.error(error);
    response
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
});

// Route for user logout
router.post("/logout", (request, response) => {
  try {
    setAuthCookies(response, "");

    response
      .status(200)
      .json({ success: true, message: "User logged out successfully" });
  } catch (error) {
    console.error(error);
    response
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
});

// Route for adding/updating profile picture
router.post("/profile-picture", async (request, response) => {
  try {
    const { userId, profilePictureLink } = request.body;

    if (!userId || !profilePictureLink) {
      return response
        .status(400)
        .json({ success: false, error: "User ID and profile picture link are required" });
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      return response
        .status(404)
        .json({ success: false, error: "User not found" });
    }

    // Update the user's profile picture link
    user.profilePictureLink = profilePictureLink;
    await user.save();

    response.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      user,
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Export the router
export default router;
