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
      unique: true,
      required: [true, "Email is required"],
      match: [
        /^\w+(\.\w+)*@\w+([\-]?\w+)*(\.\w{2,3})+$/,
        "Invalid email address",
      ],
    },
    // Define the name field with type String and validation
    name: {
      type: String,
      required: [true, "Name is required"],
      minLength: [4, "Name should be at least 4 characters"],
      maxLength: [30, "Name should be less than 30 characters"],
    },
    // Define the password field with type String and validation
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
      minLength: [6, "Password should be at least 6 characters"],
      maxLength: [30, "Password should be less than 30 characters"],
    },
    // Add a field for profile picture link
    profilePictureLink: {
      type: String,
      // Optional field, can be null if the user doesn't have a profile picture
      default: null,
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
const UserModel =
  mongoose.models.UserModel || mongoose.model("User", UserSchema);

// Export the User model
export default UserModel;
