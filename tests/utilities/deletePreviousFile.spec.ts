import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { InterfaceFile } from "../../src/models";
import { File } from "../../src/models";
import { deleteFile } from "../../src/REST/services/minio";
import { BUCKET_NAME } from "../../src/config/minio";
import { deletePreviousFile } from "../../src/utilities/encodedImageStorage/deletePreviousFile";
import type { DeleteObjectCommandOutput } from "@aws-sdk/client-s3";
import type { Document } from "mongoose";

type FileDocument = InterfaceFile & Document<unknown, unknown, InterfaceFile>;

vi.mock("../../src/models", () => ({
  File: {
    findOne: vi.fn(),
    deleteOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

vi.mock("../../src/REST/services/minio", () => ({
  deleteFile: vi.fn(),
}));

describe("deletePreviousFile", () => {
  const mockFileId = "test-file-id";
  const mockObjectKey = "test-object-key";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should delete file and record when referenceCount is 1", async () => {
    vi.mocked(File.findOne).mockResolvedValueOnce({
      referenceCount: 1,
    } as FileDocument);

    vi.mocked(File.deleteOne).mockResolvedValueOnce({
      acknowledged: true,
      deletedCount: 1,
    });
    vi.mocked(deleteFile).mockResolvedValueOnce({
      $metadata: {},
    } as DeleteObjectCommandOutput);

    await deletePreviousFile(mockFileId, mockObjectKey);

    expect(File.findOne).toHaveBeenCalledWith({
      _id: mockFileId,
    });

    expect(deleteFile).toHaveBeenCalledWith(BUCKET_NAME, mockObjectKey);

    expect(File.deleteOne).toHaveBeenCalledWith({
      _id: mockFileId,
    });

    expect(File.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("should decrement referenceCount when greater than 1", async () => {
    vi.mocked(File.findOne).mockResolvedValueOnce({
      referenceCount: 2,
    } as FileDocument);

    vi.mocked(File.findOneAndUpdate).mockResolvedValueOnce({
      referenceCount: 1,
    } as FileDocument);

    await deletePreviousFile(mockFileId, mockObjectKey);

    expect(File.findOne).toHaveBeenCalledWith({
      _id: mockFileId,
    });

    expect(deleteFile).not.toHaveBeenCalled();

    expect(File.deleteOne).not.toHaveBeenCalled();

    expect(File.findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: mockFileId,
      },
      {
        $inc: {
          referenceCount: -1,
        },
      },
    );
  });
});
