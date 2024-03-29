/* eslint-disable @typescript-eslint/no-explicit-any */
import dotenv from "dotenv";
import { nanoid } from "nanoid";
import { afterEach, describe, expect, it, vi } from "vitest";
import { deleteDuplicatedImage } from "../../src/utilities/deleteDuplicatedImage";
import * as fs from "fs";
import { logger } from "../../src/libraries";
dotenv.config();

vi.mock("fs", () => ({
  unlink: vi.fn(),
}));

const testImagePath = `${nanoid()}-testImagePath`;

describe("utilities -> deleteDuplicatedImage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should delete duplicated image", () => {
    vi.spyOn(fs, "unlink").mockImplementationOnce(
      (_imagePath: any, callback: any) => callback(null),
    );
    const logSpy = vi.spyOn(logger, "info");
    deleteDuplicatedImage(testImagePath);
    expect(fs.unlink).toBeCalledWith(testImagePath, expect.any(Function));
    expect(logSpy).toBeCalledWith(
      "File was deleted as it already exists in the db!",
    );
  });

  it("should throw error", () => {
    const error = new Error("There was an error deleting the file.");
    vi.spyOn(fs, "unlink").mockImplementationOnce(
      (_imagePath: any, callback: any) => callback(error),
    );
    const logSpy = vi.spyOn(logger, "info");
    expect(() => deleteDuplicatedImage(testImagePath)).toThrowError(error);
    expect(fs.unlink).toBeCalledWith(testImagePath, expect.any(Function));
    expect(logSpy).not.toBeCalled();
  });
});
