import { describe, it, expect } from "vitest";
import { isValidMimeType } from "../../src/utilities/isValidMimeType";

describe("isValidMimeType", () => {
  it("should return true for valid image mime types", () => {
    expect(isValidMimeType("image/jpeg")).toBe(true);
    expect(isValidMimeType("image/png")).toBe(true);
    expect(isValidMimeType("image/gif")).toBe(true);
    expect(isValidMimeType("image/webp")).toBe(true);
  });

  it("should return true for valid video mime types", () => {
    expect(isValidMimeType("video/mp4")).toBe(true);
  });

  it("should return false for invalid mime types", () => {
    expect(isValidMimeType("image/bmp")).toBe(false);
    expect(isValidMimeType("video/webm")).toBe(false);
    expect(isValidMimeType("application/pdf")).toBe(false);
    expect(isValidMimeType("")).toBe(false);
    expect(isValidMimeType("invalid-mime-type")).toBe(false);
  });
});
