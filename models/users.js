import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema } = mongoose;
const { hash } = bcrypt;

const UserSchema = new Schema({
  email: {
    type: String,
    unique: true,
    required: [true, "Email is required"],
    match: [
      /^\w+(\.\w+)*@\w+([\-]?\w+)*(\.\w{2,3})+$/,
      "Invalid email address",
    ],
  },
  name: {
    type: String,
    required: [true, "Name is required"],
    minLength: [4, "Name should be at least 4 characters"],
    maxLength: [30, "Name should be less than 30 characters"],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    select: false,
    minLength: [6, "Password should be at least 6 characters"],
    maxLength: [30, "Password should be less than 30 characters"],
  },
});

UserSchema.pre("save", async function(next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await hash(this.password, 10);
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

export default User;
