import "dotenv/config";
import { describe, it, expect } from "vitest";
import { INVALID_FILE_TYPE } from "../../../src/constants";
import { errors } from "../../../src/libraries";

describe("libraries -> errors -> InvalidFileTypeError", () => {
  it(`should throw InvalidFileTypeError error when invalid file type is received`, () => {
    try {
      throw new errors.InvalidFileTypeError(
        INVALID_FILE_TYPE.MESSAGE,
        INVALID_FILE_TYPE.CODE,
        INVALID_FILE_TYPE.PARAM,
      );
    } catch (error: unknown) {
      if (error instanceof errors.InvalidFileTypeError) {
        expect(error.errors).toEqual([
          expect.objectContaining({
            message: INVALID_FILE_TYPE.MESSAGE,
            code: INVALID_FILE_TYPE.CODE,
            param: INVALID_FILE_TYPE.PARAM,
          }),
        ]);
      }
    }
  });
});
