import jwt from "jsonwebtoken";
import UserModel from "../models/users.js";
import dotenv from "dotenv";

dotenv.config();

const { JWT_SECRET } = process.env;
const isProduction = process.env.NODE_ENV === "production";

if (!JWT_SECRET) {
  throw new Error("Invalid env variable: JWT_SECRET");
} else {
  console.log("JWT_SECRET loaded");
}

export const generateAuthToken = (_id) => {
  return jwt.sign({ _id }, JWT_SECRET, { expiresIn: "7d" });
};

export const setAuthCookies = (res, value) => {
  res.cookie("auth-token", value, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    maxAge: value ? 7 * 24 * 60 * 60 * 1000 : 0,
  });
};

export const isUserAuthorized = async (req, res, next) => {
  const token = req.cookies["auth-token"];

  if (token) {
    try {
      const data = jwt.verify(token, JWT_SECRET);

      if (typeof data !== "string") {
        const user = await UserModel.findById(data._id).catch((error) => {
          console.error("Error finding user:", error);
          return null;
        });

        if (user) {
          req.user = user;
          req.token = token;
          return next();
        }
      }
    } catch (error) {
      console.error("Token verification error:", error);
    }
  }

  return res.status(401).json({ success: false, error: "Unauthorized" });
};
