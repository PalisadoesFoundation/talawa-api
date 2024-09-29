import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { spawnSync } from "child_process";
import { setPathEnvVar } from "../../../../src/setup/setPathEnvVar";

vi.mock("os", () => ({
  platform: vi.fn().mockReturnValue("win32"),
}));
vi.mock("child_process");

describe("setPathEnvVar error handling", () => {
  const mockInstallDir = "C:\\mock\\install\\dir";
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, PATH: "C:\\original\\path" };
    vi.resetAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should throw an error if updating PATH fails", () => {
    vi.mocked(spawnSync).mockImplementation(() => {
      throw new Error("Mock error");
    });

    expect(() => setPathEnvVar(mockInstallDir)).toThrow(
      "Failed to set PATH environment variable: Mock error",
    );
  });
});
