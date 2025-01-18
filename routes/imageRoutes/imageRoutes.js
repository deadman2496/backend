// Importing the express module
import express from 'express';

// Importing the mongoose module
import mongoose from 'mongoose';

// Importing the multer module
import multer from 'multer';

// Importing the ImageModel from the models directory
import ImageModel from '../../models/images.js';

// Importing the isUserAuthorized function from the utils directory
import { isUserAuthorized, validatePrice, validateImageLink } from "../../utils/authUtils.js";

// Create a router instance with the router configuration
const router = express.Router();

// Store files in memory as Buffer objects
const storage = multer.memoryStorage();

// Create a multer instance with the storage configuration
const upload = multer({ storage: storage });

// Import the category type enum
import { IMAGE_CATEGORY } from '../../models/images.js';

// POST route for uploading an image
router.post(
  "/image",
  isUserAuthorized,
  async (request, response) => {
    try {
      // Get the authenticated user's ID
      const userId = request.user._id;

      // validate data in backend
      const { artistName, name, imageLink, price, description, category } = request.body;

      if (!artistName || !name || !imageLink || !price || !description || !category) {
        return response.status(400)
        .json({ success: false, error: "Please fill in all fields, select a category, and select an image" });
      }

      // ensure price is a float
      const price_val = validatePrice(price);
      if(!price_val){
        return response.status(400)
        .json({ success: false, error: "Price should be a valid positive number" });
      }

      // ensure image link is valid & exists
      if(!validateImageLink(imageLink)){
        return response.status(400)
        .json({ success: false, error: `Image link (${imageLink}) is not valid` });
      }

      const res = await fetch(imageLink);
      if (res.status !== 200) {
        return response.status(400)
        .json({ success: false, error: "Image is not accessible" });
      }

      // Create a new image document in the database
      const newImage = await ImageModel.create({
        userId: userId,
        artistName: artistName,
        name: name,
        imageLink: imageLink,  // Make sure this matches the Cloudinary secure_url
        price: price_val,
        description: description,
        category: category,
      });
      console.log("New Image Saved:", newImage);

      // Sending a success response after image upload
      return response
        .status(200)
        .json({ success: true, image: newImage, message: "Image uploaded and saved successfully" });
    } catch (err) {
      // catch validation error from mongoose
      if (err instanceof mongoose.Error.ValidationError) {
        const errorMsg = Object.values(err.errors)
        .map(error => error.message).join(', ');
        return response.status(400).json({ success: false, error: errorMsg });
      }

      // Handling errors and sending an error response
      console.error("Error Saving Image:", err);
      return response.status(500).json({ success: false, error: err.message });
    }
  }
);

// Route to get all images from the database
router.get('/all_images', isUserAuthorized, async (request, response) => {
  try {
    const query = {};
    const category = request.query.category;

    // if user has provided search category, validate the category type & update query
    if(category){
      if(!IMAGE_CATEGORY.includes(category)){
        return response
        .status(400)
        .json({ success: false, error: 'Please provide a valid category' });
      }
      else{
        query.category = category;
      }
    }

    // Finding all image documents in the database that match the given query
    const images = await ImageModel.find(query);

    // If no images are found, send a 404 response
    // if (images.length === 0) {
    //   return response
    //     .status(404)
    //     .json({ success: false, message: 'No images found' });
    // }

    // Prepare the response data with base64 encoded images
    const responseData = images.map((image) => ({
      _id: image._id,
      artistName: image.artistName,
      name: image.name,
      description: image.description,
      price: image.price,
      imageLink: image.imageLink,
      views: image.views, // Include the view count
      category: image.category,
      createdAt: image.createdAt,
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
router.get('/image/:id', isUserAuthorized, async (request, response) => {
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
        .json({ success: false, error: 'Image not found' });
    }

    // Prepare the response object
    const responseData = {
      _id: image._id,
      artistName: image.artistName,
      name: image.name,
      description: image.description,
      price: image.price,
      imageLink: image.imageLink,
      category: image.category,
      views: image.views,
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
  '/image/:id',
  upload.single('image'),
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
      if (request.body.price){
        // ensure price is a float
        const price_val = validatePrice(request.body.price);
        if(!price_val){
          return response.status(400)
          .json({ success: false, error: "Price should be a valid positive number" });
        }
        updateImage.price = price_val;
      }
      if (request.body.description)
        updateImage.description = request.body.description;
      if (request.body.category)
        updateImage.category = request.body.category;
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
          error: 'Image not found or not authorized to edit',
        });
      }

      // Sending a success response with the updated image data
      response.status(200).json({
        success: true,
        msg: 'Image updated successfully',
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
      console.error('Error updating image:', error);
      // Sending an internal server error response to the client
      response
        .status(500)
        .json({ success: false, error: 'Internal Server Error' });
    }
  }
);

// Route to delete an image by id
router.delete('/image/:id', isUserAuthorized, async (request, response) => {
  try {
    // Getting the userId from the authenticated user
    const userId = request.user.id;
    // Getting the imageId from the request parameters
    const imageId = request.params.id;

    // If userId is not provided, sending a 401 response
    if (!userId) {
      return response
        .status(401)
        .json({ success: false, error: 'User not authorized' });
    }

    // If imageId is not provided, sending a 400 response
    if (!imageId) {
      return response
        .status(400)
        .json({ success: false, error: 'Image ID is required' });
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
        .json({ success: false, error: "Image not found or not authorized to delete" });
    }

    // Sending a success response indicating the image was deleted
    response
      .status(200)
      .json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    // Logging the error to the console
    console.error('Error deleting image:', error);
    // Sending an internal server error response to the client
    response
      .status(500)
      .json({ success: false, error: 'Internal Server Error' });
  }
});

// Route to get all images for the authenticated user
router.get('/images', isUserAuthorized, async (request, response) => {
  try {
    // Getting the userId from the authenticated user
    const userId = request.user.id;

    // Finding all image documents for the user in the database
    const images = await ImageModel.find({ userId: userId });

    // Sending a success response with the images data
    response.status(200).json({ success: true, images });
  } catch (error) {
    // Logging the error to the console
    console.error('Error fetching images:', error);
    // Sending an internal server error response to the client
    response
      .status(500)
      .json({ success: false, error: 'Internal Server Error' });
  }
});

// // Route to update the view count of an image by id
// router.patch('/viewcount/:id/', isUserAuthorized, async (request, response) => {
//   try {
//     // Getting the userId from the authenticated user
//     const userId = request.user.id;
//     // Getting the imageId from the request parameters
//     const imageId = request.params.id;

//     // Finding and updating the viewcount
//     const increaseCount = await ImageModel.findOneAndUpdate(
//       {
//         _id: imageId,
//         userId: userId,
//       },
//       {
//         $inc: {
//           viewCount: 1,
//         },
//       },
//       // Return the updated document
//       { new: true }
//     );

//     // Check if increaseCount is null (no document found)
//     if (!increaseCount) {
//       return response
//         .status(404)
//         .json({ success: false, error: 'Image with id not found' });
//     }

//     // If the image is found and the view count is increased
//     return response
//       .status(200)
//       .json({ success: true, message: 'Image view count updated' });
//   } catch (error) {
//     // Logging the error to the console
//     console.error('Error updating image view count:', error);
//     // Sending an internal server error response to the client
//     return response
//       .status(500)
//       .json({ success: false, error: 'Internal Server Error' });
//   }
// });

// Route to update the view count of an image by id
router.patch('/increment-image-views/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the ID parameter
    if (!id || typeof id !== 'string') {
      console.log("Invalid or missing image ID.");
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing image ID',
      });
    }

    console.log(`Received request to increment views for image ID: ${id}`);

    // Find image by ID and increment view count
    const updatedImage = await ImageModel.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true, runValidators: true }
    );

    if (!updatedImage) {
      console.log("Image not found.");
      return res.status(404).json({
        success: false,
        error: 'Image not found',
      });
    }

    console.log(`Incremented views for image ID: ${id}, new view count: ${updatedImage.views}`);
    
    res.status(200).json({
      success: true,
      message: 'Image view count incremented successfully',
      image: {
        id: updatedImage._id,
        views: updatedImage.views,
      },
    });
  } catch (error) {
    console.error('Error incrementing image views:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
    });
  }
});

// Route to get image views by image ID
router.get('/get-image-views/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the ID parameter
    if (!id || typeof id !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing image ID',
      });
    }

    // Find the image by ID
    const image = await ImageModel.findById(id);

    if (!image) {
      return res.status(404).json({
        success: false,
        error: 'Image not found',
      });
    }

    // Return the view count of the image
    res.status(200).json({
      success: true,
      views: image.views, // Return the views count from the image document
      image: {
        id: image._id,
        views: image.views,
      },
    });
  } catch (error) {
    console.error('Error fetching image views:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
    });
  }
});

// Exporting the router as the default export
export default router;
