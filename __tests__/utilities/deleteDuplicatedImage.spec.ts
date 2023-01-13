import { nanoid } from "nanoid";
import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "../../src/lib/libraries";
import * as deleteDuplicatedImage from "../../src/lib/utilities/deleteDuplicatedImage";
const fs = require("fs");

const testImagePath: string = `${nanoid()}-testImagePath`;

vi.mock("fs", () => {
  const mFs = { unlink: vi.fn() };
  return mFs;
});

describe("utilities -> deleteDuplicatedImage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should delete the duplicated image", () => {
    vi.spyOn(fs, "unlink").mockImplementationOnce(
      (_imagePath: any, callback: any) => {
        callback(null);
      }
    );
    const logSpy = vi.spyOn(logger, "info");
    deleteDuplicatedImage.deleteDuplicatedImage(testImagePath);
    fs.unlink(testImagePath, () => {});
    logger.info("File was deleted as it already exists in the db!");
    expect(fs.unlink).toBeCalledWith(testImagePath, expect.any(Function));
    expect(logSpy).toBeCalledWith(
      "File was deleted as it already exists in the db!"
    );
  });

  it("should throw an error", () => {
    const mockedDeleteDuplicatedImage = vi
      .spyOn(deleteDuplicatedImage, "deleteDuplicatedImage")
      .mockImplementationOnce((_imagePath: any) => {});
    const logSpy = vi.spyOn(logger, "info");

    fs.unlink(testImagePath, () => {});
    deleteDuplicatedImage.deleteDuplicatedImage(testImagePath);
    expect(mockedDeleteDuplicatedImage).toBeCalledWith(testImagePath);
    expect(
      deleteDuplicatedImage.deleteDuplicatedImage(testImagePath)
    ).toBeUndefined();
    expect(fs.unlink).toBeCalledWith(testImagePath, expect.any(Function));
    expect(logSpy).not.toBeCalled();
  });
});
