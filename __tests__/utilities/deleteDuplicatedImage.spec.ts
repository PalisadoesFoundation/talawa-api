require("dotenv").config();
import { nanoid } from "nanoid";
import fs from "fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as deleteDuplicatedImage from "../../src/lib/utilities/deleteDuplicatedImage";
import { logger } from "../../src/lib/libraries";

const testImagePath: string = `${nanoid()}-testImagePath`;

describe("utilities -> deleteDuplicatedImage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should handle unlinking image", async () => {
    const mockedDeleteDuplicatedImage = vi
      .spyOn(deleteDuplicatedImage, "deleteDuplicatedImage")
      .mockImplementation((_imagePath: any) => null);
    const mockedFs = vi
      .spyOn(fs, "unlink")
      .mockImplementationOnce((_imagePath: any, callback: any) => {
        callback(new Error("error"));
      });
    const mockedLogger = vi.spyOn(logger, "info");
    deleteDuplicatedImage.deleteDuplicatedImage(testImagePath);
    fs.unlink(testImagePath, () => {});
    logger.info("File was deleted as it already exists in the db!");
    expect(mockedDeleteDuplicatedImage).toBeCalledWith(testImagePath);
    expect(mockedFs).toBeCalledWith(testImagePath, expect.any(Function));
    expect(deleteDuplicatedImage.deleteDuplicatedImage(testImagePath)).toBe(
      null
    );
    expect(mockedLogger).toBeCalledWith(
      "File was deleted as it already exists in the db!"
    );
  });
});
