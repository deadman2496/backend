import express from "express";
import mongoose from "mongoose";
import pkg from "bcryptjs";
import cookieParser from "cookie-parser";
const { compare } = pkg;
import dotenv from "dotenv";
import UserModel from "./models/users.js";
import ImageModel from "./models/images.js";
import { setAuthCookies, generateAuthToken } from "./auth.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());

const { MONGO_URL } = process.env;

if (!MONGO_URL) {
  console.log("MONGO_URL", MONGO_URL);
  throw new Error("Invalid env variable: MONGO_URL");
} else {
  console.log("MONGO_URL loaded");
}

mongoose
  .connect(MONGO_URL)
  .then(() => console.log("connection successful"))
  .catch((error) => console.log("error connecting to mongodb", error));

app.get("/", (res) => {
  res.send({ status: "working" });
});

app.post("/signup", async (req, res) => {
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

    res.status(200).json({ success: true, msg: "Signup successful" });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      for (let field in error.errors) {
        const msg = error.errors[field].message;
        return res.status(400).json({ success: false, msg });
      }
    }

    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

app.post("/login", async (req, res) => {
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

    res.status(200).json({ success: true, msg: "Login successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

app.post("/logout", (req, res) => {
  try {
    setAuthCookies(res, "");

    res
      .status(200)
      .json({ success: true, msg: "User logged out successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});



// TODO add POST user images route which will add a document to the database with the user id and image name, URL, price, view count and description



// TODO setup GET all user images by user id (_id) route
// app.get('/user-images', async (req, res, _id) => {

//     // const user = await UserModel.findOne({ email }).select("+password");
//     userImages = await ImageModel.find({ _id})
//     });



// TODO add PATCH route to edit user image by id  which will edit that document to the database with the user id and image name, URL, price, view count and description

// TODO add a delete user image route to delete a image by image id

app.listen(4000, () => {
  console.log(`connected to port 4000`);
});


