// Import the Mongoose library for MongoDB
import mongoose from "mongoose";

// Import the bcrypt library for hashing passwords
import bcrypt from "bcryptjs";

// Destructure the Schema constructor from mongoose
const { Schema } = mongoose;

// Destructure the hash function from bcrypt
const { hash } = bcrypt;

// Define the UserSchema using the Schema constructor
const UserSchema = new Schema(
  {
    // Define the email field with type String, uniqueness, and validation
    email: {
      type: String,
      // Email must be unique
      unique: true,
      // Email is required with a custom error message
      required: [true, "Email is required"],
      match: [
        // Regular expression for email validation
        /^\w+(\.\w+)*@\w+([\-]?\w+)*(\.\w{2,3})+$/,
        // Custom error message for invalid email format
        "Invalid email address",
      ],
    },
    // Define the name field with type String and validation
    name: {
      type: String,
      // Name is required with a custom error message
      required: [true, "Name is required"],
      // Minimum length of 4 characters with a custom error message
      minLength: [4, "Name should be at least 4 characters"],
      // Maximum length of 30 characters with a custom error message
      maxLength: [30, "Name should be less than 30 characters"],
    },
    // Define the password field with type String and validation
    password: {
      type: String,
      // Password is required with a custom error message
      required: [true, "Password is required"],
      // Password field will not be selected by default in queries
      select: false,
      // Minimum length of 6 characters with a custom error message
      minLength: [6, "Password should be at least 6 characters"],
      // Maximum length of 30 characters with a custom error message
      maxLength: [30, "Password should be less than 30 characters"],
    },
  },
  {
    // Add timestamps for createdAt and updatedAt
    timestamps: true,
    versionKey: "__v",
  }
);

// Middleware to hash the password before saving if it's modified
UserSchema.pre("save", async function(next) {
  if (!this.isModified("password")) {
    return next();
  }
  // Hash the password with a salt factor of 10
  this.password = await hash(this.password, 10);
});

// Create the User model using the UserSchema, or retrieve it if it already exists
const User = mongoose.models.User || mongoose.model("User", UserSchema);

// Export the User model
export default User;
