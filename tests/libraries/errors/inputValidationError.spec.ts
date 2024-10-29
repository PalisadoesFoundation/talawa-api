import "dotenv/config";
import { describe, it, expect } from "vitest";
import { USER_FAMILY_MIN_MEMBERS_ERROR_CODE } from "../../../src/constants";
import { errors } from "../../../src/libraries";

describe("libraries -> errors -> InputValidationError", () => {
  it(`should throw InputValidationError error when input is invalid`, () => {
    try {
      throw new errors.InputValidationError(
        USER_FAMILY_MIN_MEMBERS_ERROR_CODE.MESSAGE,
        USER_FAMILY_MIN_MEMBERS_ERROR_CODE.CODE,
        USER_FAMILY_MIN_MEMBERS_ERROR_CODE.PARAM,
      );
    } catch (error: unknown) {
      if (error instanceof errors.InputValidationError) {
        expect(error.errors).toEqual([
          expect.objectContaining({
            message: USER_FAMILY_MIN_MEMBERS_ERROR_CODE.MESSAGE,
            code: USER_FAMILY_MIN_MEMBERS_ERROR_CODE.CODE,
            param: USER_FAMILY_MIN_MEMBERS_ERROR_CODE.PARAM,
          }),
        ]);
      }
    }
  });
});
