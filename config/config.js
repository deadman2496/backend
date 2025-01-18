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

if (!JWT_SECRET) {
    // Log the value of JWT_SECRET (which will be undefined)
    console.log("JWT_SECRET", JWT_SECRET);
    // Throw an error if JWT_SECRET is not set
    throw new Error("Invalid env variable: JWT_SECRET");
  } else {
    // Log that JWT_SECRET is loaded
    console.log("JWT_SECRET loaded");
  }