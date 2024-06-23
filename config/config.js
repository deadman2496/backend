import dotenv from "dotenv";

dotenv.config();

export const { MONGO_URL, JWT_SECRET } = process.env;

if (!MONGO_URL) {
  console.log("MONGO_URL", MONGO_URL);
  throw new Error("Invalid env variable: MONGO_URL");
} else {
  console.log("MONGO_URL loaded");
}
