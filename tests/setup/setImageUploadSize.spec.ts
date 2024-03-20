import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  setImageUploadSize,
  validateImageFileSize,
} from "../../src/setup/setImageUploadSize";
import fs from "fs";
import dotenv from "dotenv";
import { MAXIMUM_IMAGE_SIZE_LIMIT_KB } from "../../src/constants";

describe("setImageUploadSize", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
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
