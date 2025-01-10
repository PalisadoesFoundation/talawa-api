import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { spawnSync } from "child_process";
import { setPathEnvVar } from "../../../../src/setup/setPathEnvVar";

vi.mock("os", () => ({
  platform: vi.fn().mockReturnValue("win32"),
}));
vi.mock("child_process");

describe("setPathEnvVar on Windows", () => {
  const mockInstallDir = "C:\\mock\\install\\dir";
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, PATH: "C:\\original\\path" };
    vi.resetAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should update PATH for Windows", () => {
    const mockSpawnSync = vi.mocked(spawnSync);

    setPathEnvVar(mockInstallDir);

    expect(mockSpawnSync).toHaveBeenCalledWith(
      "setx",
      ["PATH", `${process.env.PATH};${mockInstallDir}`],
      { shell: true, stdio: "inherit" },
    );
  });
});
