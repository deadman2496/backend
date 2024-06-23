import mongoose from "mongoose";

const { Schema } = mongoose;

const ImageSchema = new Schema({
  userId: {
    type: String,
    required: [true, "UserId is required"],
  },
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
    validate: {
      validator: function(value) {
        const urlRegex = /^(http|https):\/\/[^ "]+$/;
        return urlRegex.test(value);
      },
      message: "Invalid URL",
    },
  },
  price: {
    type: String,
    required: [true, "Price is required"],
    select: false,
    min: [1, "Price should be greater than $0.99"],
    max: [1000000, "Price should be less than $1,000,000"],
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    minLength: [4, "Description should be at least 4 characters"],
    maxLength: [30, "Description should be less than 30 characters"],
  },
  viewCount: {
    type: Number,
    default: 0,
    select: false,
  },
});

const Image = mongoose.models.Image || mongoose.model("Image", ImageSchema);

export default Image;
