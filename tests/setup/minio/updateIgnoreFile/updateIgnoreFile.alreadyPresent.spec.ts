import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
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

  it("should not update the ignore file if directoryToIgnore is already included", () => {
    const existingContent = "# MinIO data directory\nminio-data/**\n";
    vi.mocked(fs.readFileSync).mockReturnValue(existingContent);
    const writeFileSyncSpy = vi.spyOn(fs, "writeFileSync");

    updateIgnoreFile(mockFilePath, mockDirectoryToIgnore);

    expect(writeFileSyncSpy).not.toHaveBeenCalled();
  });
});
