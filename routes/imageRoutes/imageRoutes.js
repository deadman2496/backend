import express from "express";
import mongoose from "mongoose";
import ImageModel from "../../models/images.js";
import { isUserAuthorized } from "../../utils/authUtils.js";

const router = express.Router();

router.post("/image", isUserAuthorized, async (req, res) => {
  try {
    const { name, imageURL, price, description } = req.body;
    const userId = req.user._id;

    const newImage = await ImageModel.create({
      userId,
      name,
      imageURL,
      price,
      description,
    });

    console.log("New image added successfully");

    res
      .status(200)
      .json({ success: true, message: "Image added successfully" });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      for (let field in error.errors) {
        const message = error.errors[field].message;
        return res.status(400).json({ success: false, message });
      }
    }

    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.get("/image/:id", isUserAuthorized, async (req, res) => {
  try {
    const userId = req.user._id;
    const imageId = req.params.id;

    const image = await ImageModel.findOne({ _id: imageId, userId });

    if (!image) {
      return res
        .status(404)
        .json({ success: false, error: "Image not found or not authorized" });
    }

    res.status(200).json({ success: true, image });
  } catch (error) {
    console.error("Error fetching image:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.patch("/image/:id", isUserAuthorized, async (req, res) => {
  try {
    const userId = req.user._id;
    const imageId = req.params.id;
    const { name, imageURL, price, description } = req.body;

    const updatedImage = await ImageModel.findOneAndUpdate(
      { _id: imageId, userId },
      { name, imageURL, price, description },
      { new: true, runValidators: true }
    );

    if (!updatedImage) {
      return res.status(404).json({
        success: false,
        error: "Image not found or not authorized to edit",
      });
    }

    res.status(200).json({
      success: true,
      msg: "Image updated successfully",
      image: updatedImage,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      for (let field in error.errors) {
        const msg = error.errors[field].message;
        return res.status(400).json({ success: false, msg });
      }
    }

    console.error("Error updating image:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.delete("/image/:id", isUserAuthorized, async (req, res) => {
  try {
    const userId = req.user._id;
    const imageId = req.params.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "User not authorized" });
    }

    if (!imageId) {
      return res
        .status(400)
        .json({ success: false, error: "Image ID is required" });
    }

    const deletedImage = await ImageModel.findOneAndDelete({
      _id: imageId,
      userId,
    });

    if (!deletedImage) {
      return res.status(404).json({ success: false, error: "Image not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.get("/images", isUserAuthorized, async (req, res) => {
  try {
    const userId = req.user._id;

    const images = await ImageModel.find({ userId });

    res.status(200).json({ success: true, images });
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

export default router;
