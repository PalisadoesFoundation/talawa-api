import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { updateIgnoreFile } from "../../../../src/setup/updateIgnoreFile";

vi.mock("fs", () => ({
  existsSync: vi.fn().mockReturnValue(true),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

vi.mock("path", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    relative: vi.fn().mockReturnValue("minio-data"),
  };
});

describe("updateIgnoreFile", () => {
  const mockFilePath = ".gitignore";
  const mockDirectoryToIgnore = "./minio-data";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update the ignore file if directoryToIgnore is not already included", () => {
    vi.mocked(fs.readFileSync).mockReturnValue("");
    const writeFileSyncSpy = vi.spyOn(fs, "writeFileSync");

    updateIgnoreFile(mockFilePath, mockDirectoryToIgnore);

    const expectedContent = "\n# MinIO data directory\nminio-data/**\n";
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      mockFilePath,
      expectedContent,
    );
  });

  it("should not update the ignore file if directoryToIgnore is already included", () => {
    const existingContent = "# MinIO data directory\nminio-data/**\n";
    vi.mocked(fs.readFileSync).mockReturnValue(existingContent);
    const writeFileSyncSpy = vi.spyOn(fs, "writeFileSync");

    updateIgnoreFile(mockFilePath, mockDirectoryToIgnore);

    expect(writeFileSyncSpy).not.toHaveBeenCalled();
  });

  it("should create the ignore file if it does not exist", () => {
    vi.spyOn(path, "relative").mockReturnValue("minio-data");
    vi.spyOn(fs, "existsSync").mockReturnValue(false);
    const writeFileSyncSpy = vi.spyOn(fs, "writeFileSync");

    updateIgnoreFile(mockFilePath, mockDirectoryToIgnore);

    const expectedContent = "\n# MinIO data directory\nminio-data/**\n";
    expect(writeFileSyncSpy).toHaveBeenCalledWith(
      mockFilePath,
      expectedContent,
    );
  });

  it("should not update the ignore file if directoryToIgnore is outside the project root", () => {
    vi.spyOn(path, "relative").mockReturnValue("../outside-directory");
    const writeFileSyncSpy = vi.spyOn(fs, "writeFileSync");

    updateIgnoreFile(mockFilePath, "/outside-project/minio-data");

    expect(writeFileSyncSpy).not.toHaveBeenCalled();
  });
});
