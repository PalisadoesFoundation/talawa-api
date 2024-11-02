import { describe, it, expect, vi, beforeEach } from "vitest";
import { File } from "../../src/models";
import { deleteFile } from "../../src/REST/services/file";
import * as minioServices from "../../src/REST/services/minio";
import { BUCKET_NAME } from "../../src/config/minio";

vi.mock("../../src/models", () => ({
  File: {
    findOne: vi.fn(),
    deleteOne: vi.fn(),
    prototype: {
      save: vi.fn(),
    },
  },
}));

vi.mock("../../src/REST/controllers/minio", () => ({
  deleteFile: vi.fn(),
}));

describe("deleteFile", () => {
  const objectKey = "test/file/path";
  const fileId = "12345";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return success:false and message if file is not found", async () => {
    // Mock findOne to return null, indicating file not found
    vi.mocked(File.findOne).mockResolvedValueOnce(null);

    const result = await deleteFile(objectKey, fileId);

    expect(result).toEqual({ success: false, message: "File not found." });
    expect(File.findOne).toHaveBeenCalledWith({
      _id: fileId,
      "metadata.objectKey": objectKey,
    });
  });

  it("should decrement reference count if file exists and reference count is greater than 1", async () => {
    // Mock findOne to return an existing file with referenceCount > 1
    const mockFile = {
      referenceCount: 2,
      save: vi.fn().mockResolvedValueOnce(this),
    };
    vi.mocked(File.findOne).mockResolvedValueOnce(mockFile);

    const result = await deleteFile(objectKey, fileId);

    expect(result).toEqual({
      success: true,
      message: "File reference count decreased successfully",
    });
    expect(mockFile.referenceCount).toBe(1); // Check that referenceCount was decremented
    expect(mockFile.save).toHaveBeenCalled();
  });

  it("should delete the file from the database and storage if reference count is 1", async () => {
    // Mock findOne to return a file with referenceCount = 1
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
