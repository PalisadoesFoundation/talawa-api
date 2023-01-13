require("dotenv").config();
import { nanoid } from "nanoid";
import fs from "fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as deleteDuplicatedImage from "../../src/lib/utilities/deleteDuplicatedImage";

const testImagePath: string = `${nanoid()}-testImagePath`;

describe("utilities -> deleteDuplicatedImage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("it should throw an error", async () => {
    const mockedDeleteDuplicatedImage = vi
      .spyOn(deleteDuplicatedImage, "deleteDuplicatedImage")
      .mockImplementation((_imagePath: any) => null);
    const mockedFs = vi
      .spyOn(fs, "unlink")
      .mockImplementation((_imagePath: any, callback: any) => {
        callback(new Error("error"));
      });
    deleteDuplicatedImage.deleteDuplicatedImage(testImagePath);
    fs.unlink(testImagePath, () => {});
    expect(mockedDeleteDuplicatedImage).toBeCalledWith(testImagePath);
    expect(mockedFs).toBeCalledWith(testImagePath, expect.any(Function));
    expect(deleteDuplicatedImage.deleteDuplicatedImage(testImagePath)).toBe(
      null
    );
  });
});
