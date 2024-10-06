import { describe, it, expect, vi } from "vitest";
import { execSync } from "child_process";
import { isMinioInstalled } from "../../../../src/setup/isMinioInstalled";

vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));

describe("isMinioInstalled - Command Available", () => {
  it("should return true if minio command is available", () => {
    vi.mocked(execSync).mockImplementation(() => "minio --version");

    expect(isMinioInstalled()).toBe(true);
    expect(execSync).toHaveBeenCalledWith("minio --version", {
      stdio: "ignore",
    });
  });
});
