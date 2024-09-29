import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { execSync } from "child_process";
import { setPathEnvVar } from "../../../../src/setup/setPathEnvVar";

vi.mock("os", () => ({
  platform: vi.fn().mockReturnValue("linux"),
}));
vi.mock("child_process");

describe("setPathEnvVar on Linux", () => {
  const mockInstallDir = "/mock/install/dir";
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, PATH: "/original/path" };
    vi.resetAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should update PATH for Linux", () => {
    const mockExecSync = vi.mocked(execSync);

    setPathEnvVar(mockInstallDir);

    expect(process.env.PATH).toBe(`/original/path:${mockInstallDir}`);
    expect(mockExecSync).toHaveBeenCalledWith(
      `echo 'export PATH=$PATH:${mockInstallDir}' >> ~/.bashrc`,
    );
  });
});
