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

// Calls Sharp package for resizing buffer
import sharp from "sharp";

// POST route for uploading an image
router.post(
  "/image",
  upload.single("image"),
  isUserAuthorized,
  async (request, response) => {
    try {
      // Check the file size of the user submitted image is not greater than 4.5mb
      if (request.file.size >= 4.5e6) {
        throw new Error("File is too large!");
      }
      // Getting the userId from the authenticated user
      const userId = request.user._id;
      let resizeImage = await sharp(request.file.buffer)
        .jpeg({ mozjpeg: true, quality: 80 })
        .resize(320, 240)
        .toBuffer();

      resizeImage = Buffer.from(resizeImage);
      // Create a new image document in the database
      const newImage = await ImageModel.create({
        userId: userId,
        name: request.body.name,
        imageFile: {
          data: resizeImage, //request.file.buffer, // Store file buffer directly
          contentType: "image/jpeg", //request.file.mimetype || "image/jpeg",
        },
        price: request.body.price,
        description: request.body.description,
      });
      console.log(newImage);

      // Sending a success response after image upload
      response
        .status(200)
        .json({ success: true, message: "Image uploaded successfully" });
    } catch (err) {
      // Handling errors and sending an error response
      console.error(err);
      response.status(500).json({ success: false, error: err.message?.data });
    }
  }
);

// Route to get all images from the database
router.get('/all_images', isUserAuthorized, async (request, response) => {
  try {
    // Finding all image documents in the database
    const images = await ImageModel.find({});

    // If no images are found, send a 404 response
    if (images.length === 0) {
      return response
        .status(404)
        .json({ success: false, message: 'No images found' });
    }

    // Prepare the response data with base64 encoded images
    const responseData = images.map(image => ({
      _id: image._id,
      name: image.name,
      description: image.description,
      price: image.price,
      imageData: {
        contentType: image.imageFile.contentType,
        data: image.imageFile.data.toString('base64'), // Convert Buffer to base64 string
      },
      viewCount: image.viewCount, // Include the view count
    }));

    // Send the combined JSON response
    response.status(200).json({ success: true, images: responseData });
  } catch (error) {
    // Logging the error to the console
    console.error('Error fetching images:', error);
    // Sending an internal server error response to the client
    response
      .status(500)
      .json({ success: false, error: 'Internal Server Error' });
  }
});


// GET route for fetching an image by ID
router.get("/image/:id", isUserAuthorized, async (request, response) => {
  try {
    // Getting the userId from the authenticated user
    const userId = request.user._id;

    // Get the image ID from the request parameters
    const imageId = request.params.id;

    // Find the image in the database by its ID and user ID
    const image = await ImageModel.findOne({ _id: imageId, userId: userId });

    if (!image) {
      return response
        .status(404)
        .json({ success: false, error: "Image not found" });
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
    response.json(responseData);
  } catch (err) {
    console.error(err);
    response.status(500).json({ success: false, error: err.message });
  }
});

// Route to update an image by id
router.patch(
  "/image/:id",
  upload.single("image"),
  isUserAuthorized,
  async (request, response, next) => {
    try {
      // Getting the userId from the authenticated user
      const userId = request.user._id;
      // Getting the imageId from the request parameters
      const imageId = request.params.id;

      // Prepare the update object
      const updateImage = {};
      if (request.body.name) updateImage.name = request.body.name;
      if (request.file) {
        updateImage.imageFile = {
          data: request.file.buffer,
          contentType: request.file.mimetype,
        };
      }
      if (request.body.price) updateImage.price = request.body.price;
      if (request.body.description)
        updateImage.description = request.body.description;
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
        return response.status(404).json({
          success: false,
          error: "Image not found or not authorized to edit",
        });
      }

      // Sending a success response with the updated image data
      response.status(200).json({
        success: true,
        msg: "Image updated successfully",
        image: updatedImage,
      });
    } catch (error) {
      // Handling validation errors from mongoose
      if (error instanceof mongoose.Error.ValidationError) {
        for (let field in error.errors) {
          const msg = error.errors[field].message;
          return response.status(400).json({ success: false, msg });
        }
      }

      // Logging the error to the console
      console.error("Error updating image:", error);
      // Sending an internal server error response to the client
      response
        .status(500)
        .json({ success: false, error: "Internal Server Error" });
    }
  }
);

// Route to delete an image by id
router.delete("/image/:id", isUserAuthorized, async (request, response) => {
  try {
    // Getting the userId from the authenticated user
    const userId = request.user.id;
    // Getting the imageId from the request parameters
    const imageId = request.params.id;

    // If userId is not provided, sending a 401 response
    if (!userId) {
      return response
        .status(401)
        .json({ success: false, error: "User not authorized" });
    }

    // If imageId is not provided, sending a 400 response
    if (!imageId) {
      return response
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
      return response
        .status(404)
        .json({ success: false, error: "Image not found" });
    }

    // Sending a success response indicating the image was deleted
    response
      .status(200)
      .json({ success: true, message: "Image deleted successfully" });
  } catch (error) {
    // Logging the error to the console
    console.error("Error deleting image:", error);
    // Sending an internal server error response to the client
    response
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
});

// Route to get all images for the authenticated user
router.get("/images", isUserAuthorized, async (request, response) => {
  try {
    // Getting the userId from the authenticated user
    const userId = request.user.id;

    // Finding all image documents for the user in the database
    const images = await ImageModel.find({ userId: userId });

    // Sending a success response with the images data
    response.status(200).json({ success: true, images });
  } catch (error) {
    // Logging the error to the console
    console.error("Error fetching images:", error);
    // Sending an internal server error response to the client
    response
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
});

// Route to update the view count of an image by id
router.patch("/viewcount/:id/", isUserAuthorized, async (request, response) => {
  try {
    // Getting the userId from the authenticated user
    const userId = request.user.id;
    // Getting the imageId from the request parameters
    const imageId = request.params.id;

    // Finding and updating the viewcount
    const increaseCount = await ImageModel.findOneAndUpdate(
      {
        _id: imageId,
        userId: userId,
      },
      {
        $inc: {
          viewCount: 1,
        },
      },
      // Return the updated document
      { new: true }
    );

    // Check if increaseCount is null (no document found)
    if (!increaseCount) {
      return response
        .status(404)
        .json({ success: false, error: "Image with id not found" });
    }

    // If the image is found and the view count is increased
    return response
      .status(200)
      .json({ success: true, message: "Image view count updated" });
  } catch (error) {
    // Logging the error to the console
    console.error("Error updating image view count:", error);
    // Sending an internal server error response to the client
    return response
      .status(500)
      .json({ success: false, error: "Internal Server Error" });
  }
});

// Exporting the router as the default export
export default router;