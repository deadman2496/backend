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
router.post("/signup", async (req, res) => {
  try {
    // Destructure name, email, and password from the request body
    const { name, email, password } = req.body;

    // Check if a user with the given email already exists
    const userExists = await UserModel.findOne({ email });

    // If the user exists, return a 409 conflict status
    if (userExists) {
      return res
        .status(409)
        .json({ success: false, error: "User already exists" });
    }

    // Create a new user with the provided details
    const newUser = await UserModel.create({
      name,
      email,
      password,
    });

    // Log a message indicating successful user creation
    console.log("New user created successfully");

    // Respond with a success message
    res.status(200).json({ success: true, message: "Signup successful" });
  } catch (error) {
    // Handle Mongoose validation errors
    if (error instanceof mongoose.Error.ValidationError) {
      for (let field in error.errors) {
        const message = error.errors[field].message;
        return res.status(400).json({ success: false, message });
      }
    }

    // Log and respond with an internal server error for other errors
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Route for user login
router.post("/login", async (req, res) => {
  try {
    // Destructure email and password from the request body
    const { email, password } = req.body;

    // Check if email is provided
    if (!email) {
      return res
        .status(400)
        .json({ success: false, error: "Email is required" });
    }

    // Check if password is provided
    if (!password) {
      return res
        .status(400)
        .json({ success: false, error: "Password is required" });
    }

    // Find the user by email and select the password field
    const user = await UserModel.findOne({ email }).select("+password");

    // If the user is not found, return a 404 not found status
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    // Compare the provided password with the stored hashed password
    const isPasswordCorrect = await compare(password, user.password);

    // If the password is incorrect, return a 401 unauthorized status
    if (!isPasswordCorrect) {
      return res
        .status(401)
        .json({ success: false, error: "Incorrect password" });
    }

    // Generate an authentication token for the user
    const authToken = generateAuthToken(user._id);

    // Set the authentication cookies in the response
    setAuthCookies(res, authToken);

    // Respond with a success message
    res.status(200).json({ success: true, message: "Login successful" });
  } catch (error) {
    // Log and respond with an internal server error for other errors
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Route for user logout
router.post("/logout", (req, res) => {
  try {
    // Clear the authentication cookies
    setAuthCookies(res, "");

    // Respond with a success message
    res
      .status(200)
      .json({ success: true, message: "User logged out successfully" });
  } catch (error) {
    // Log and respond with an internal server error for other errors
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Export the router
export default router;
