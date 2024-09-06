import { describe, it, expect, vi, afterAll } from "vitest";
import { execSync } from "child_process";
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
  });
});
