import { describe, it, expect, vi, afterAll } from "vitest";
import { execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";
import { isMinioInstalled } from "../../../../src/setup/isMinioInstalled";

vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    existsSync: vi.fn().mockReturnValue(true),
  };
});
vi.mock("child_process", () => ({
  exec: vi.fn(),
  execSync: vi.fn(),
}));
vi.mock("os", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    platform: vi.fn().mockReturnValue("linux"),
  };
});
vi.mock("path", () => ({ join: vi.fn().mockReturnValue("/home/minio/minio") }));

describe("isMinioInstalled - Binary File Exists", async () => {
  afterAll(() => {
    vi.resetAllMocks();
    vi.resetModules();
  });
  it("should return true if minio binary file exists", () => {
    vi.mocked(execSync).mockImplementation((command: string) => {
      if (command === "minio --version") {
        throw new Error("Command not found");
      }
      return Buffer.from("");
    });

    expect(isMinioInstalled()).toBe(true);
    expect(fs.existsSync).toHaveBeenCalledWith(
      path.join("/home", ".minio", "minio"),
    );
  });
});
