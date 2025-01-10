import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { File } from "../../src/models";
import { deleteFile } from "../../src/REST/services/file";
import * as minioServices from "../../src/REST/services/minio";
import { BUCKET_NAME } from "../../src/config/minio";
import { isMinioRunning } from "../helpers/minio";

vi.mock("../../src/models", () => ({
  File: {
    findOne: vi.fn(),
    deleteOne: vi.fn(),
    prototype: {
      save: vi.fn(),
    },
  },
}));

vi.mock("../../src/REST/services/minio", () => ({
  deleteFile: vi.fn(),
}));

const objectKey = "test/file/path";
const fileId = "12345";
let serverRunning = false;

beforeAll(async () => {
  try {
    serverRunning = await isMinioRunning();
  } catch (error) {
    console.error("Error checking MinIO server status:", error);
  }
});

// Clear mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

// Generic file tests
describe("File deletion logic", () => {
  it("should return success:false and message if file is not found", async () => {
    vi.mocked(File.findOne).mockResolvedValueOnce(null);

    const result = await deleteFile(objectKey, fileId);

    expect(result).toEqual({ success: false, message: "File not found." });
    expect(File.findOne).toHaveBeenCalledWith({
      _id: fileId,
      "metadata.objectKey": objectKey,
    });
  });

  it("should decrement reference count if file exists and reference count is greater than 1", async () => {
    const mockFile = {
      referenceCount: 2,
      save: vi.fn().mockResolvedValueOnce(undefined),
    };
    vi.mocked(File.findOne).mockResolvedValueOnce(mockFile);

    const result = await deleteFile(objectKey, fileId);

    expect(result).toEqual({
      success: true,
      message: "File reference count decreased successfully",
    });
    expect(mockFile.referenceCount).toBe(1);
    expect(mockFile.save).toHaveBeenCalled();
  });

  it("should handle errors and return an error message", async () => {
    const mockError = new Error("Deletion failed");
    vi.mocked(File.findOne).mockRejectedValueOnce(mockError);

    const consoleErrorSpy = vi.spyOn(console, "error");

    const result = await deleteFile(objectKey, fileId);

    expect(result).toEqual({
      success: false,
      message: "Error occurred while deleting file",
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Error deleting file:",
      mockError,
    );
  });
});

// MinIO-specific tests
describe("MinIO server integration tests", () => {
  beforeAll(async () => {
    serverRunning = await isMinioRunning();
  });

  it("should delete the file from the database and storage if reference count is 1", async () => {
    if (!serverRunning) {
      return; // Skip the test if the server isn't running
    }

    const mockFile = {
      referenceCount: 1,
      _id: fileId,
      id: fileId,
    };
    vi.mocked(File.findOne).mockResolvedValueOnce(mockFile);

    const deleteFileFromBucketSpy = vi.spyOn(minioServices, "deleteFile");

    const result = await deleteFile(objectKey, fileId);

    expect(result).toEqual({
      success: true,
      message: "File deleted successfully",
    });
    expect(File.deleteOne).toHaveBeenCalledWith({ _id: fileId });
    expect(deleteFileFromBucketSpy).toHaveBeenCalledWith(
      BUCKET_NAME,
      objectKey,
    );
  });
});
