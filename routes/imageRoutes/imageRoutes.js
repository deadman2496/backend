// Importing the express module
import express from "express";

// Importing the mongoose module
import mongoose from "mongoose";

// Importing the ImageModel from the models directory
import ImageModel from "../../models/images.js";

// Importing the isUserAuthorized function from the utils directory
import { isUserAuthorized } from "../../utils/authUtils.js";

// Creating a new router instance
const router = express.Router();

// Route to add a new image
router.post("/image", isUserAuthorized, async (req, res) => {
  try {
    // Destructuring the necessary fields from the request body
    const { name, imageURL, price, description } = req.body;
    // Getting the userId from the authenticated user
    const userId = req.user._id;

    // Creating a new image document in the database
    const newImage = await ImageModel.create({
      userId,
      name,
      imageURL,
      price,
      description,
    });

    // Logging a success message to the console
    console.log("New image added successfully");

    // Sending a success response to the client
    res
      .status(200)
      .json({ success: true, message: "Image added successfully" });
  } catch (error) {
    // Handling validation errors from mongoose
    if (error instanceof mongoose.Error.ValidationError) {
      for (let field in error.errors) {
        const message = error.errors[field].message;
        return res.status(400).json({ success: false, message });
      }
    }

    // Logging the error to the console
    console.error(error);
    // Sending an internal server error response to the client
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Route to get an image by id
router.get("/image/:id", isUserAuthorized, async (req, res) => {
  try {
    // Getting the userId from the authenticated user
    const userId = req.user._id;
    // Getting the imageId from the request parameters
    const imageId = req.params.id;

    // Finding the image document in the database
    const image = await ImageModel.findOne({ _id: imageId, userId });

    // If the image is not found, sending a 404 response
    if (!image) {
      return res
        .status(404)
        .json({ success: false, error: "Image not found or not authorized" });
    }

    // Sending a success response with the image data
    res.status(200).json({ success: true, image });
  } catch (error) {
    // Logging the error to the console
    console.error("Error fetching image:", error);
    // Sending an internal server error response to the client
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Route to update an image by id
router.patch("/image/:id", isUserAuthorized, async (req, res) => {
  try {
    // Getting the userId from the authenticated user
    const userId = req.user._id;
    // Getting the imageId from the request parameters
    const imageId = req.params.id;
    // Destructuring the fields to update from the request body
    const { name, imageURL, price, description } = req.body;

    // Finding and updating the image document in the database
    const updatedImage = await ImageModel.findOneAndUpdate(
      { _id: imageId, userId },
      {
        name,
        imageURL,
        price,
        description,
        // increments version key
        $inc: { __v: 1 },
      },
      // return the new or updated document
      {
        new: true,
        // makes sure the updated document follows model schema validations
        runValidators: true,
      }
    );

    // If the image is not found, sending a 404 response
    if (!updatedImage) {
      return res.status(404).json({
        success: false,
        error: "Image not found or not authorized to edit",
      });
    }

    // Sending a success response with the updated image data
    res.status(200).json({
      success: true,
      msg: "Image updated successfully",
      image: updatedImage,
    });
  } catch (error) {
    // Handling validation errors from mongoose
    if (error instanceof mongoose.Error.ValidationError) {
      for (let field in error.errors) {
        const msg = error.errors[field].message;
        return res.status(400).json({ success: false, msg });
      }
    }

    // Logging the error to the console
    console.error("Error updating image:", error);
    // Sending an internal server error response to the client
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Route to delete an image by id
router.delete("/image/:id", isUserAuthorized, async (req, res) => {
  try {
    // Getting the userId from the authenticated user
    const userId = req.user._id;
    // Getting the imageId from the request parameters
    const imageId = req.params.id;

    // If userId is not provided, sending a 401 response
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "User not authorized" });
    }

    // If imageId is not provided, sending a 400 response
    if (!imageId) {
      return res
        .status(400)
        .json({ success: false, error: "Image ID is required" });
    }

    // Finding and deleting the image document in the database
    const deletedImage = await ImageModel.findOneAndDelete({
      _id: imageId,
      userId,
    });

    // If the image is not found, sending a 404 response
    if (!deletedImage) {
      return res.status(404).json({ success: false, error: "Image not found" });
    }

    // Sending a success response indicating the image was deleted
    res
      .status(200)
      .json({ success: true, message: "Image deleted successfully" });
  } catch (error) {
    // Logging the error to the console
    console.error("Error deleting image:", error);
    // Sending an internal server error response to the client
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Route to get all images for the authenticated user
router.get("/images", isUserAuthorized, async (req, res) => {
  try {
    // Getting the userId from the authenticated user
    const userId = req.user._id;

    // Finding all image documents for the user in the database
    const images = await ImageModel.find({ userId });

    // Sending a success response with the images data
    res.status(200).json({ success: true, images });
  } catch (error) {
    // Logging the error to the console
    console.error("Error fetching images:", error);
    // Sending an internal server error response to the client
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Exporting the router as the default export
export default router;
