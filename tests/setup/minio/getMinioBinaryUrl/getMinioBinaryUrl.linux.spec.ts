import { describe, it, expect, vi } from "vitest";
import { getMinioBinaryUrl } from "../../../../src/setup/getMinioBinaryUrl";

vi.mock("os", () => ({
  platform: vi.fn().mockReturnValue("linux"),
}));

describe("getMinioBinaryUrl - Linux", () => {
  it("should return the correct URL for Linux", () => {
    const result = getMinioBinaryUrl();
    expect(result).toBe(
      "https://dl.min.io/server/minio/release/linux-amd64/minio",
    );
  });
});
