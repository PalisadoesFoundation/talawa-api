import "dotenv/config";
import { describe, it, expect } from "vitest";
import { IMAGE_SIZE_LIMIT_KB } from "../../../src/constants";
import { errors } from "../../../src/libraries";

describe("libraries -> errors -> ImageSizeLimitExceeded", () => {
  it(`should throw ImageSizeLimitExceeded error when image size exceeds the limit`, () => {
    try {
      throw new errors.ImageSizeLimitExceeded(
        IMAGE_SIZE_LIMIT_KB.MESSAGE,
        IMAGE_SIZE_LIMIT_KB.CODE,
        IMAGE_SIZE_LIMIT_KB.PARAM,
      );
    } catch (error: unknown) {
      if (error instanceof errors.ImageSizeLimitExceeded) {
        expect(error.errors).toEqual([
          expect.objectContaining({
            message: IMAGE_SIZE_LIMIT_KB.MESSAGE,
            code: IMAGE_SIZE_LIMIT_KB.CODE,
            param: IMAGE_SIZE_LIMIT_KB.PARAM,
          }),
        ]);
      }
    }
  });
});
