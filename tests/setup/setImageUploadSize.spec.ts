import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  setImageUploadSize,
  validateImageFileSize,
} from "../../src/setup/setImageUploadSize";
import fs from "fs";
import dotenv from "dotenv";
import { MAXIMUM_IMAGE_SIZE_LIMIT_KB } from "../../src/constants";

/* Test Cases for setImageUploadSize

Test Case 1: Setting a valid image upload size within the limit
Description: When setImageUploadSize is called with a valid size within the maximum limit, it should update the correct .env file with the provided size.
Expected Behavior: The .env_test file should be truncated, and the new size should be appended to it.

Test Case 2: Setting an image upload size exceeding the maximum limit
Description: When setImageUploadSize is called with a size exceeding the maximum limit, it should set the size to the maximum limit and update the .env file.
Expected Behavior: The .env_test file should be truncated, and the maximum limit size should be appended to it.

Test Case 3: Setting the image upload size in a non-test environment
Description: When setImageUploadSize is called in a non-test environment (e.g., development, production), it should update the regular .env file.
Expected Behavior: The .env file should be truncated, and the new size should be appended to it.

Test Cases for validateImageFileSize

Test Case 4: Validating a valid image file size
Description: When validateImageFileSize is called with a valid size within the allowed range, it should return true.
Expected Behavior: The function should return true.

Test Case 5: Validating an invalid image file size of 0
Description: When validateImageFileSize is called with a size of 0, it should return false.
Expected Behavior: The function should return false.

Test Case 6: Validating a negative image file size
Description: When validateImageFileSize is called with a negative size, it should return false.
Expected Behavior: The function should return false.
*/

describe("setImageUploadSize", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should set the image upload size correctly in .env file", async () => {
    vi.spyOn(dotenv, "parse").mockResolvedValue({
      IMAGE_SIZE_LIMIT_KB: "500",
    });
    vi.spyOn(fs, "readFileSync").mockReturnValue("IMAGE_SIZE_LIMIT_KB=500");

    const writeFileSyncMock = vi.spyOn(fs, "writeFileSync");
    const appendFileSyncMock = vi.spyOn(fs, "appendFileSync");

    await setImageUploadSize(500);

    expect(writeFileSyncMock).toHaveBeenCalledWith(".env_test", "");
    expect(appendFileSyncMock).toHaveBeenCalledWith(
      ".env_test",
      "IMAGE_SIZE_LIMIT_KB=500\n",
    );
  });

  it("should set the image upload size correctly in .env file when size is larger than the maximum limit", async () => {
    vi.spyOn(dotenv, "parse").mockResolvedValue({
      IMAGE_SIZE_LIMIT_KB: MAXIMUM_IMAGE_SIZE_LIMIT_KB.toString(),
    });
    vi.spyOn(fs, "readFileSync").mockReturnValue(
      `IMAGE_SIZE_LIMIT_KB=${MAXIMUM_IMAGE_SIZE_LIMIT_KB}`,
    );
    const writeFileSyncMock = vi.spyOn(fs, "writeFileSync");
    const appendFileSyncMock = vi.spyOn(fs, "appendFileSync");
    await setImageUploadSize(MAXIMUM_IMAGE_SIZE_LIMIT_KB + 1);

    expect(writeFileSyncMock).toHaveBeenCalledWith(".env_test", "");
    expect(appendFileSyncMock).toHaveBeenCalledWith(
      ".env_test",
      `IMAGE_SIZE_LIMIT_KB=${MAXIMUM_IMAGE_SIZE_LIMIT_KB}\n`,
    );
  });

  it("should set the image upload size when node environment is not 'test'", async () => {
    process.env.NODE_ENV = "development";

    vi.spyOn(dotenv, "parse").mockResolvedValue({
      IMAGE_SIZE_LIMIT_KB: "1000",
    });

    vi.spyOn(fs, "readFileSync").mockReturnValue("IMAGE_SIZE_LIMIT_KB=1000");
    const writeFileSyncMock = vi.spyOn(fs, "writeFileSync").mockReturnThis();
    const appendFileSyncMock = vi.spyOn(fs, "appendFileSync").mockReturnThis();

    await setImageUploadSize(500);

    expect(writeFileSyncMock).toHaveBeenCalledWith(".env", "");
    expect(appendFileSyncMock).toHaveBeenCalledWith(
      ".env",
      `IMAGE_SIZE_LIMIT_KB=500\n`,
    );
    process.env = originalEnv;
  });
});

describe("validateImageFileSize", () => {
  it("should return true for a valid image file size", () => {
    expect(validateImageFileSize(10)).toBe(true);
  });

  it("should return false for an invalid image file size of 0", () => {
    expect(validateImageFileSize(0)).toBe(false);
  });

  it("should return false for a negative image file size", () => {
    expect(validateImageFileSize(-5)).toBe(false);
  });
});
