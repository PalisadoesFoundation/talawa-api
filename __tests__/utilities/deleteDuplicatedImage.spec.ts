require("dotenv").config();
import { nanoid } from "nanoid";
import { afterEach, describe, expect, it, vi } from "vitest";
import { logger } from "../../src/lib/libraries";
import * as deleteDuplicatedImage from "../../src/lib/utilities/deleteDuplicatedImage";
const fs = require("fs");

const testImagePath: string = `${nanoid()}-testImagePath`;

// vi.mock("../../src/lib/libraries/logger", () => {
//   return {
//     info: vi.fn(),
//   };
// });

vi.mock("fs", () => {
  return {
    unlink: vi.fn(),
  };
});

describe("utilities -> deleteDuplicatedImage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("it should throw an error", async () => {
    const mockedDeleteDuplicatedImage = vi
      .spyOn(deleteDuplicatedImage, "deleteDuplicatedImage")
      .mockImplementation((_imagePath: any) => {});

    deleteDuplicatedImage.deleteDuplicatedImage(testImagePath);
    expect(mockedDeleteDuplicatedImage).toBeCalledWith(testImagePath);
    expect(
      deleteDuplicatedImage.deleteDuplicatedImage(testImagePath)
    ).toBeUndefined();
  });

  it("it should delete duplicated image", () => {
    // fs.unlink
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
});
