import { describe, it, expect, vi } from "vitest";
import { execSync } from "child_process";
import { isMinioInstalled } from "../../../../src/setup/isMinioInstalled";

vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    existsSync: vi.fn().mockReturnValue(false),
  };
});
vi.mock("child_process", () => ({
  execSync: vi.fn(),
}));
vi.mock("os", () => ({
  homedir: vi.fn().mockReturnValue("/home"),
  platform: vi.fn(),
}));

describe("isMinioInstalled - Neither Available", () => {
  it("should return false if minio command is not available and binary file does not exist", () => {
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error("Command not found");
    });

    expect(isMinioInstalled()).toBe(false);
  });
});
