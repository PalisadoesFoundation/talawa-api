require("dotenv").config();
import { nanoid } from "nanoid";
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

    deleteDuplicatedImage.deleteDuplicatedImage(testImagePath);
    expect(mockedDeleteDuplicatedImage).toBeCalledWith(testImagePath);
    expect(deleteDuplicatedImage.deleteDuplicatedImage(testImagePath)).toBe(
      null
    );
  });
});
