/**
 * module - createFile
 *
 * This module contains unit tests for the `createFile` function in the file service.
 * The tests utilize Vitest for mocking and asserting behavior.
 *
 * ### Tests
 *
 * - **Test Case 1**: `should create a new file document when no existing file is found`
 *   - Verifies that when a file with a specific hash does not exist, a new file document is created in the database.
 *   - It checks that `File.findOne` is called with the correct hash and that `File.create` is invoked with the expected file details.
 *
 * - **Test Case 2**: `should increment reference count if an existing file is found`
 *   - Confirms that if a file with the same hash already exists, the reference count for that file is incremented.
 *   - It ensures that the `save` method of the existing file is called and that `File.create` is not invoked.
 *
 * @example
 * import \{ createFile \} from "./path/to/createFile";
 *
 * const result = await createFile(uploadResult, originalname, mimetype, size);
 *
 * @see {@link ../../src/REST/services/file#createFile}
 * @see {@link ../../src/models#File}
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { File } from "../../src/models";
import { createFile } from "../../src/REST/services/file";

vi.mock("../../src/models", () => ({
  File: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

describe("createFile", () => {
  const uploadResult = {
    hash: "testHash123",
    objectKey: "test/file/path",
    hashAlgorithm: "sha256",
    exists: false,
  };

  const originalname = "image.png";
  const mimetype = "image/png";
  const size = 2048;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a new file document when no existing file is found", async () => {
    vi.mocked(File.findOne).mockResolvedValueOnce(null);

    const createdFile = File.create({
      fileName: originalname,
      mimeType: mimetype,
      size: size,
      hash: {
        value: uploadResult.hash,
        algorithm: uploadResult.hashAlgorithm,
      },
      uri: `http://localhost:3000/api/file/${uploadResult.objectKey}`,
      metadata: {
        objectKey: uploadResult.objectKey,
        bucketName: "test-bucket",
      },
    });

    const result = await createFile(uploadResult, originalname, mimetype, size);

    expect(result).toEqual(createdFile);
    expect(File.findOne).toHaveBeenCalledWith({
      "hash.value": uploadResult.hash,
    });
    expect(File.create).toHaveBeenCalledWith({
      fileName: originalname,
      mimeType: mimetype,
      size: size,
      hash: {
        value: uploadResult.hash,
        algorithm: uploadResult.hashAlgorithm,
      },
      uri: expect.any(String),
      metadata: {
        objectKey: uploadResult.objectKey,
        bucketName: expect.any(String),
      },
    });
  });

  it("should increment reference count if an existing file is found", async () => {
    const existingFile = {
      referenceCount: 1,
      save: vi.fn().mockResolvedValueOnce(undefined),
    };
    vi.mocked(File.findOne).mockResolvedValueOnce(existingFile);

    const result = await createFile(uploadResult, originalname, mimetype, size);

    expect(result).toEqual(existingFile);
    expect(File.findOne).toHaveBeenCalledWith({
      "hash.value": uploadResult.hash,
    });
    expect(existingFile.referenceCount).toBe(2);
    expect(existingFile.save).toHaveBeenCalled();
    expect(File.create).not.toHaveBeenCalled();
  });
});
