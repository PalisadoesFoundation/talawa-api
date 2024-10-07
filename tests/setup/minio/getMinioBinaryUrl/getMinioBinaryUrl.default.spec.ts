import { describe, it, expect, vi } from "vitest";
import { getMinioBinaryUrl } from "../../../../src/setup/getMinioBinaryUrl";

vi.mock("os", () => ({
  platform: vi.fn().mockReturnValue("unsupported-platform"),
}));

describe("getMinioBinaryUrl - Unsupported Platform", () => {
  it("should throw an error for unsupported platform", () => {
    expect(() => {
      getMinioBinaryUrl();
    }).toThrowError(new Error("Unsupported platform: unsupported-platform"));
  });
});
