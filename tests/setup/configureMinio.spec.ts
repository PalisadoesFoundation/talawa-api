import { it, expect, vi, describe } from "vitest";
import inquirer from "inquirer";
import dotenv from "dotenv";
import fs from "fs";
import { configureMinio } from "../../setup";

describe("Setup -> configureMinio", () => {
  it("should configure MinIO and update .env_test if valid data is provided", async () => {
    const validData = {
      MINIO_ROOT_USER: "dockeruser",
      MINIO_ROOT_PASSWORD: "dockerpass",
      MINIO_BUCKET: "dockerbucket",
      MINIO_ENDPOINT: "http://minio:9000",
    };

    vi.spyOn(inquirer, "prompt").mockResolvedValueOnce(validData);

    await configureMinio(true);

    const env = dotenv.parse(fs.readFileSync(".env_test"));

    expect(env.MINIO_ROOT_USER).toEqual(validData.MINIO_ROOT_USER);
    expect(env.MINIO_ROOT_PASSWORD).toEqual(validData.MINIO_ROOT_PASSWORD);
    expect(env.MINIO_BUCKET).toEqual(validData.MINIO_BUCKET);
    expect(env.MINIO_ENDPOINT).toEqual(validData.MINIO_ENDPOINT);
  });

  it("should handle file system errors", async () => {
    vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
      MINIO_ROOT_USER: "user",
      MINIO_ROOT_PASSWORD: "pass",
      MINIO_BUCKET: "bucket",
    });

    vi.spyOn(fs, "readFileSync").mockImplementation(() => {
      throw new Error("File read error");
    });

    await expect(configureMinio(false)).rejects.toThrow("File read error");
  });

  it("should handle write file system errors", async () => {
    const validData = {
      MINIO_ROOT_USER: "dockeruser",
      MINIO_ROOT_PASSWORD: "dockerpass",
      MINIO_BUCKET: "dockerbucket",
    };

    vi.spyOn(inquirer, "prompt").mockResolvedValueOnce(validData);
    vi.spyOn(fs, "readFileSync").mockReturnValue("SOME_EXISTING_VAR=value");
    vi.spyOn(dotenv, "parse").mockReturnValue({ SOME_EXISTING_VAR: "value" });
    vi.spyOn(fs, "writeFileSync").mockImplementation(() => {
      throw new Error("File write error");
    });

    await expect(configureMinio(true)).rejects.toThrow("File write error");
  });
});
