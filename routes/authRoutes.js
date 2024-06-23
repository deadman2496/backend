import express from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
const { compare } = bcrypt;
import UserModel from "../models/users.js";
import { setAuthCookies, generateAuthToken } from "../utils/authUtils.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await UserModel.findOne({ email });

    if (userExists) {
      return res
        .status(409)
        .json({ success: false, error: "User already exists" });
    }

    const newUser = await UserModel.create({
      name,
      email,
      password,
    });

    console.log("New user created successfully");

    res.status(200).json({ success: true, message: "Signup successful" });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      for (let field in error.errors) {
        const message = error.errors[field].message;
        return res.status(400).json({ success: false, message });
      }
    }

    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, error: "Email is required" });
    }
    if (!password) {
      return res
        .status(400)
        .json({ success: false, error: "Password is required" });
    }

    const user = await UserModel.findOne({ email }).select("+password");

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    const isPasswordCorrect = await compare(password, user.password);

    if (!isPasswordCorrect) {
      return res
        .status(401)
        .json({ success: false, error: "Incorrect password" });
    }

    const authToken = generateAuthToken(user._id);
    setAuthCookies(res, authToken);

    res.status(200).json({ success: true, message: "Login successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.post("/logout", (req, res) => {
  try {
    setAuthCookies(res, "");

    res
      .status(200)
      .json({ success: true, message: "User logged out successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

export default router;
