import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { MONGO_URL } from "./config/config.js";
import authRoutes from "./routes/authRoutes/authRoutes.js";
import imageRoutes from "./routes/imageRoutes/imageRoutes.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/", authRoutes);
app.use("/", imageRoutes);

const PORT = 4000;

mongoose
  .connect(MONGO_URL)
  .then(() => console.log("connection successful"))
  .catch((error) => {
    console.log("error connecting to mongodb", error);
    process.exit(1);
  });

// req = request, res = response
app.get("/", (req, res) => {
  res.send({ status: "working" });
});
app.listen(PORT, () => {
  console.log(`Sever running at http://localhost:${PORT}`);
});
