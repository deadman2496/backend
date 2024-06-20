import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema } = mongoose;
const { hash } = bcrypt;

const ImageSchema = new Schema({
    name: {
    type: String,
    required: [true, "Name is required"],
    minLength: [4, "Name should be at least 4 characters"],
    maxLength: [30, "Name should be less than 30 characters"],
  },
  imageURL: {
    type: String,
    unique: true,
    required: [true, "Image URL is required"],
    match: [
      /^\w+(\.\w+)*@\w+([\-]?\w+)*(\.\w{2,3})+$/,
      "Invalid URL",
    ],
  },
  price: {
    type: String,
    required: [true, "Price is required"],
    select: false,
    minPrice: [1, "Price should be greater than $0.99"],
    maxPrice: [1000000, "Price should be less than $1,000,000"],
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    minLength: [4, "Description should be at least 4 characters"],
    maxLength: [30, "Description should be less than 30 characters"],
  },
  viewCount: {
    type: String,
    select: false,
  },
});

ImageSchema.pre("save", async function(next) {
  if (!this.isModified("imageURL")) {
    return next();
  }
  if (!this.isModified("name")) {
    return next();
  }
  if (!this.isModified("price")) {
    return next();
  }
  if (!this.isModified("description")) {
    return next();
  }
  
});

const Image = mongoose.models.Image || mongoose.model("Image", ImageSchema);

export default Image;
