import { describe, it, expect, vi } from "vitest";
import { getMinioBinaryUrl } from "../../../../src/setup/getMinioBinaryUrl";

vi.mock("os", () => ({
  platform: vi.fn().mockReturnValue("win32"),
}));

describe("getMinioBinaryUrl - Windows", () => {
  it("should return the correct URL for Windows", () => {
    const result = getMinioBinaryUrl();
    expect(result).toBe(
      "https://dl.min.io/server/minio/release/windows-amd64/minio.exe",
    );
  });
});
