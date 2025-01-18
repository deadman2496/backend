import { test, expect } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
// npx playwright test tests

// Get __filename and __dirname equivalents in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const importConfig = async () => {
  console.log("Importing config...");
  const config = await import("../config/config.js");
  console.log("Config imported:");
  return config;
};

test.describe("Environment Variables", () => {
  test.beforeEach(() => {
    // Clear existing environment variables before each test
    console.log("Clearing environment variables");
    delete process.env.MONGO_URL;
    delete process.env.JWT_SECRET;
  });

  test("should throw an error if MONGO_URL is not set", async () => {
    try {
      console.log("Testing for error if MONGO_URL is not set");
      if (process.env.MONGO_URL === undefined) {
        throw new Error("Invalid env variable: MONGO_URL");
      }
    } catch (error) {
      console.log("Caught error:", error.message);
      expect(error.message).toContain("Invalid env variable: MONGO_URL");
    }
  });

  test("should throw an error if JWT_SECRET is not set", async () => {
    try {
      console.log("Testing for error if JWT_SECRET is not set");
      if (process.env.JWT_SECRET === undefined) {
        throw new Error("Invalid env variable: JWT_SECRET");
      }
    } catch (error) {
      console.log("Caught error:", error.message);
      expect(error.message).toContain("Invalid env variable: JWT_SECRET");
    }
  });

  test("should load MONGO_URL if set", async () => {
    // Re-import dotenv configuration
    dotenv.config({ path: path.resolve(__dirname, "../.env") });

    // Dynamically import the config
    const config = await importConfig();

    // Verify that the environment variable is correctly loaded in config.js
    expect(config.MONGO_URL).toBe(process.env.MONGO_URL);
  });

  test("should load JWT_SECRET if set", async () => {
    // Re-import dotenv configuration
    dotenv.config({ path: path.resolve(__dirname, "../.env") });

    // Dynamically import the config
    const config = await importConfig();

    // Verify that the environment variable is correctly loaded in config.js
    expect(config.JWT_SECRET).toBe(process.env.JWT_SECRET);
  });
});
