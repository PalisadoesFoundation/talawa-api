import { afterEach, describe, expect, it, vi } from "vitest";
import { imageExtensionCheck } from "../../src/utilities/imageExtensionCheck";
import * as deleteImage from "../../src/utilities/deleteImage";
import { requestContext } from "../../src/libraries";
import { INVALID_FILE_TYPE } from "../../src/constants";
import { InvalidFileTypeError } from "../../src/libraries/errors";

const testFilename = "test.anyOtherExtension";

const testErrors = [
  {
    message: INVALID_FILE_TYPE.MESSAGE,
    code: INVALID_FILE_TYPE.CODE,
    param: INVALID_FILE_TYPE.PARAM,
  },
];

const testMessage = "invalid.fileType";

describe("utilities -> imageExtensionCheck", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("throws Validation Error and calls deleteImage", async () => {
    const mockedDeleteImage = vi
      .spyOn(deleteImage, "deleteImage")
      .mockImplementation(() => {
        return Promise.resolve();
      });

    const mockedRequestTranslate = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => {
        return message;
      });

    try {
      await imageExtensionCheck(testFilename);
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(InvalidFileTypeError);
      const e = error as InvalidFileTypeError;
      expect(e.message).toEqual(testMessage);
      expect(e.errors).toEqual(testErrors);
    }

    expect(mockedDeleteImage).toHaveBeenCalledOnce();
    expect(mockedRequestTranslate).toBeCalledTimes(2);
    expect(mockedRequestTranslate).toBeCalledWith("invalid.fileType");
  });
});
