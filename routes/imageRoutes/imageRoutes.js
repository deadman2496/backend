// Importing the express module
import express from "express";

// Importing the mongoose module
import mongoose from "mongoose";

// Importing the multer module
import multer from "multer";

// Importing the ImageModel from the models directory
import ImageModel from "../../models/images.js";

// Importing the isUserAuthorized function from the utils directory
import { isUserAuthorized } from "../../utils/authUtils.js";

// Create a router instance with the router configuration
const router = express.Router();

// Store files in memory as Buffer objects
const storage = multer.memoryStorage();

// Create a multer instance with the storage configuration
const upload = multer({ storage: storage });

// POST route for uploading an image
router.post(
  "/image",
  upload.single("image"),
  isUserAuthorized,
  async (req, res) => {
    try {
      // Getting the userId from the authenticated user
      const userId = req.user._id;

      // Create a new image document in the database
      const newImage = await ImageModel.create({
        userId: userId,
        name: req.body.name,
        imageFile: {
          data: req.file.buffer, // Store file buffer directly
          contentType: req.file.mimetype,
        },
        price: req.body.price,
        description: req.body.description,
      });

      // Sending a success response after image upload
      res
        .status(200)
        .json({ success: true, message: "Image uploaded successfully" });
    } catch (err) {
      // Handling errors and sending an error response
      console.error(err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
);

// GET route for fetching an image by ID
router.get("/image/:id", isUserAuthorized, async (req, res) => {
  try {
    // Getting the userId from the authenticated user
    const userId = req.user._id;

    // Get the image ID from the request parameters
    const imageId = req.params.id;

    // Find the image in the database by its ID and user ID
    const image = await ImageModel.findOne({ _id: imageId, userId: userId });

    if (!image) {
      return res.status(404).json({ success: false, error: "Image not found" });
    }

    // Prepare the response object
    const responseData = {
      _id: image._id,
      name: image.name,
      description: image.description,
      price: image.price,
      imageData: {
        contentType: image.imageFile.contentType,
        data: image.imageFile.data.toString("base64"), // Convert Buffer to base64 string
      },
    };

    // Send the combined JSON response
    res.json(responseData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Route to update an image by id
router.patch(
  "/image/:id",
  upload.single("image"),
  isUserAuthorized,
  async (req, res, next) => {
    try {
      // Getting the userId from the authenticated user
      const userId = req.user._id;
      // Getting the imageId from the request parameters
      const imageId = req.params.id;

      // Prepare the update object
      const updateImage = {};
      if (req.body.name) updateImage.name = req.body.name;
      if (req.file) {
        updateImage.imageFile = {
          data: req.file.buffer,
          contentType: req.file.mimetype,
        };
      }
      if (req.body.price) updateImage.price = req.body.price;
      if (req.body.description) updateImage.description = req.body.description;
      // Increment the version key
      updateImage.$inc = { __v: 1 };

      // Finding and updating the image document in the database
      const updatedImage = await ImageModel.findOneAndUpdate(
        { _id: imageId, userId: userId },
        updateImage,
        { new: true, runValidators: true }
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
  }
);

// Route to delete an image by id
router.delete("/image/:id", isUserAuthorized, async (req, res) => {
  try {
    // Getting the userId from the authenticated user
    const userId = req.user.id;
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
      userId: userId,
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
    const userId = req.user.id;

    // Finding all image documents for the user in the database
    const images = await ImageModel.find({ userId: userId });

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
