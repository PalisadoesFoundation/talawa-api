/**
 * Tests for the file upload functionality.
 *
 * This test suite validates the uploadFile service which handles file uploads in the application.
 * The service processes incoming files, validates their types, uploads them to storage, and creates
 * corresponding database records.
 *
 * Test Coverage:
 * - Input validation for missing files
 * - MIME type validation for uploaded files
 * - Successful file upload flow including storage and database operations
 * - Error handling for upload failures
 *
 * Mock Strategy:
 * - External services (uploadMedia, createFile) are mocked to isolate the upload logic
 * - File validation utilities are mocked to control validation responses
 * - Express Request/Response objects are mocked with necessary properties
 *
 * package - REST/services/file
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";

import { isValidMimeType } from "../../src/utilities/isValidMimeType";
import { errors, requestContext } from "../../src/libraries";
import { FILE_NOT_FOUND } from "../../src/constants";
import { BUCKET_NAME } from "../../src/config/minio";
import { createFile, uploadFile } from "../../src/REST/services/file";
import { uploadMedia } from "../../src/REST/services/minio";
import { Types } from "mongoose";

vi.mock("../../src/REST/services/minio", () => ({
  uploadMedia: vi.fn(),
}));

vi.mock("../../src/REST/services/file/createFile", () => ({
  createFile: vi.fn(),
}));

vi.mock("../../src/utilities/isValidMimeType", () => ({
  isValidMimeType: vi.fn(),
}));

vi.mock("../../src/libraries/requestContext", () => ({
  translate: (message: string): string => `Translated ${message}`,
}));

describe("uploadFile", () => {
  const mockFile = {
    buffer: Buffer.from("mock file content"),
    mimetype: "image/png",
    originalname: "test-image.png",
    size: 1024,
  };

  const mockRequest = {
    file: mockFile,
  } as unknown as Request;

  const mockResponse = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as Response;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return error if no file is uploaded", async () => {
    const reqWithoutFile = {} as Request;

    await expect(uploadFile(reqWithoutFile, mockResponse)).rejects.toThrow(
      errors.InputValidationError,
    );

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: requestContext.translate(FILE_NOT_FOUND.MESSAGE),
    });
  });

  it("should return error if file type is invalid", async () => {
    vi.mocked(isValidMimeType).mockReturnValueOnce(false);

    await expect(uploadFile(mockRequest, mockResponse)).rejects.toThrow(
      errors.InputValidationError,
    );

    expect(isValidMimeType).toHaveBeenCalledWith(mockFile.mimetype);
  });

  it("should upload file and return file document data", async () => {
    const mockUploadResult = {
      hash: "mockhash",
      objectKey: "mock-object-key",
      hashAlgorithm: "SHA-256",
      exists: false,
    };

    const mockFileDoc = {
      _id: new Types.ObjectId(),
      fileName: "test-image.png",
      mimeType: "image/png",
      size: 1024,
      hash: {
        value: "mockhash",
        algorithm: "SHA-256",
      },
      uri: "http://localhost/api/file/mock-object-key",
      referenceCount: 1,
      metadata: {
        objectKey: "mock-object-key",
      },
      encryption: false,
      archived: false,
      visibility: "PUBLIC" as const,
      backupStatus: "",
      status: "ACTIVE" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(isValidMimeType).mockReturnValueOnce(true);
    vi.mocked(uploadMedia).mockResolvedValueOnce(mockUploadResult);
    vi.mocked(createFile).mockResolvedValueOnce(mockFileDoc);

    const result = await uploadFile(mockRequest, mockResponse);

    expect(uploadMedia).toHaveBeenCalledWith(
      BUCKET_NAME,
      mockFile.buffer,
      mockFile.originalname,
      { ContentType: mockFile.mimetype },
    );
    expect(createFile).toHaveBeenCalledWith(
      mockUploadResult,
      mockFile.originalname,
      mockFile.mimetype,
      mockFile.size,
    );
    expect(result).toEqual({
      uri: mockFileDoc.uri,
      _id: mockFileDoc._id,
      visibility: mockFileDoc.visibility,
      objectKey: mockFileDoc.metadata.objectKey,
    });
  });

  it("should return an internal server error if upload fails", async () => {
    const mockError = new Error("Failed to upload");

    vi.mocked(isValidMimeType).mockReturnValueOnce(true);
    vi.mocked(uploadMedia).mockRejectedValueOnce(mockError);

    await expect(uploadFile(mockRequest, mockResponse)).rejects.toThrow(
      errors.InternalServerError,
    );

    expect(mockResponse.status).not.toHaveBeenCalledWith(400);
  });
});
