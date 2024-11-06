import { describe, test, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import express from "express";
import request from "supertest";

import { upload } from "../../src/config/multer";
import { fileUpload } from "../../src/middleware";
import {
  CONTENT_TYPE_SHOULD_BE_MULTIPART_FORM_DATA,
  FILE_SIZE_EXCEEDED,
  IMAGE_SIZE_LIMIT,
  INVALID_FILE_FIELD_NAME,
  VIDEO_SIZE_LIMIT,
} from "../../src/constants";

vi.mock("../../src/libraries/requestContext", () => ({
  translate: (message: string): string => message,
}));

describe("fileUpload Middleware", () => {
  let app: express.Application;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create new Express app for each test
    app = express();

    // Add json and urlencoded middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Add test route with the middleware
    app.post("/upload", fileUpload("file"), (_req: Request, res: Response) => {
      res.status(200).json({ message: "Upload successful" });
    });
  });

  test("should reject requests without multipart/form-data content type", async () => {
    const response = await request(app)
      .post("/upload")
      .set("Content-Type", "application/json")
      .send({ data: "test" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: CONTENT_TYPE_SHOULD_BE_MULTIPART_FORM_DATA.MESSAGE,
    });
  });

  test("should reject request with no file", async () => {
    const imageBuffer = Buffer.from("fake image content");
    const response = await request(app)
      .post("/upload")
      .set("Content-Type", "multipart/form-data")
      .field("someField", "someValue")
      .attach("different-file-field-name", imageBuffer, {
        filename: "test.jpg",
        contentType: "image/jpeg",
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: INVALID_FILE_FIELD_NAME.MESSAGE,
    });
  });

  test("should accept valid image upload", async () => {
    // Create a small buffer to simulate an image file
    const imageBuffer = Buffer.from("fake image content");

    const response = await request(app)
      .post("/upload")
      .attach("file", imageBuffer, {
        filename: "test.jpg",
        contentType: "image/jpeg",
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Upload successful",
    });
  });

  test("should accept valid video upload", async () => {
    // Create a small buffer to simulate a video file
    const videoBuffer = Buffer.from("fake video content");

    const response = await request(app)
      .post("/upload")
      .attach("file", videoBuffer, {
        filename: "test.mp4",
        contentType: "video/mp4",
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Upload successful",
    });
  });

  test("should reject image exceeding size limit", async () => {
    const largeImageBuffer = Buffer.alloc(IMAGE_SIZE_LIMIT + 1);

    const response = await request(app)
      .post("/upload")
      .attach("file", largeImageBuffer, {
        filename: "large.jpg",
        contentType: "image/jpeg",
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: FILE_SIZE_EXCEEDED.MESSAGE,
      description: "Image size exceeds the limit of 5MB",
    });
  });

  test("should reject video exceeding size limit", async () => {
    const largeVideoBuffer = Buffer.alloc(VIDEO_SIZE_LIMIT + 1);

    const response = await request(app)
      .post("/upload")
      .attach("file", largeVideoBuffer, {
        filename: "large.mp4",
        contentType: "video/mp4",
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: FILE_SIZE_EXCEEDED.MESSAGE,
      description: "Video size exceeds the limit of 50MB",
    });
  });

  test("should throw error on exceeding the multer max file size", async () => {
    const largeVideoBuffer = Buffer.alloc(VIDEO_SIZE_LIMIT + 3);

    const response = await request(app)
      .post("/upload")
      .attach("file", largeVideoBuffer, {
        filename: "large.mp4",
        contentType: "video/mp4",
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "File too large",
    });
  });

  test("should handle multiple files correctly", async () => {
    const imageBuffer = Buffer.from("fake image content");

    const response = await request(app)
      .post("/upload")
      .attach("file", imageBuffer, "test1.jpg")
      .attach("anotherFile", imageBuffer, "test2.jpg");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: INVALID_FILE_FIELD_NAME.MESSAGE,
    });
  });

  test("should accept request with no file when content-type is correct", async () => {
    const response = await request(app)
      .post("/upload")
      .set("Content-Type", "multipart/form-data")
      .field("someField", "someValue");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Upload successful",
    });
  });

  test("should reject files with wrong field name", async () => {
    const imageBuffer = Buffer.from("fake image content");

    const response = await request(app)
      .post("/upload")
      .attach("wrongField", imageBuffer, "test.jpg");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: INVALID_FILE_FIELD_NAME.MESSAGE,
    });
  });

  test("should handle generic upload errors", async () => {
    const multerMock = vi.spyOn(upload, "single").mockImplementation(() => {
      return (req, res, next): void => {
        next(new Error("Generic upload error"));
      };
    });

    const imageBuffer = Buffer.from("fake image content");

    const response = await request(app)
      .post("/upload")
      .attach("file", imageBuffer, {
        filename: "test.jpg",
        contentType: "image/jpeg",
      });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: "File upload failed",
    });

    multerMock.mockRestore();
  });
});
