import { describe, it, expect, vi } from "vitest";
import { getMinioBinaryUrl } from "../../../../src/setup/getMinioBinaryUrl";

vi.mock("os", () => ({
  platform: vi.fn().mockReturnValue("darwin"),
}));

describe("getMinioBinaryUrl - macOS", () => {
  it("should return the correct URL for macOS", () => {
    const result = getMinioBinaryUrl();
    expect(result).toBe(
      "https://dl.min.io/server/minio/release/darwin-amd64/minio",
    );
  });
});
