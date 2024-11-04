// routes/fileRoutes.ts
import express from "express";

import { getFile } from "../controllers/query/getFile";
import { createPost, updatePost } from "../controllers/mutation";

import { isAuthMiddleware } from "../../middleware";
import { fileUpload } from "../../middleware/fileUpload";

const router = express.Router();

// Routes

// Routes
/**
 * Retrieves a file by its key.
 * isAuthMiddleware - Authenticates the user.
 * getFile - Handles fetching the requested file.
 */
router.get("/file/*", getFile);

router.post("/create-post", isAuthMiddleware, fileUpload("file"), createPost);

router.post(
  "/update-post/:id",
  isAuthMiddleware,
  fileUpload("file"),
  updatePost,
);

export default router;
