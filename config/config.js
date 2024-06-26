// Import dotenv to load environment variables from a .env file
import dotenv from "dotenv";

// Load environment variables from the .env file
dotenv.config();

// Destructure MONGO_URL and JWT_SECRET variables from the environment variables
export const { MONGO_URL, JWT_SECRET } = process.env;

// Check if MONGO_URL is defined
if (!MONGO_URL) {
  // Log the value of MONGO_URL (which will be undefined)
  console.log("MONGO_URL", MONGO_URL);
  // Throw an error if MONGO_URL is not set
  throw new Error("Invalid env variable: MONGO_URL");
} else {
  // Log that MONGO_URL is loaded
  console.log("MONGO_URL loaded");
}
