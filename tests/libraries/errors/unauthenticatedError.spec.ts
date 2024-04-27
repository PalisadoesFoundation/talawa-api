import "dotenv/config";
import { describe, expect, it } from "vitest";
import { UNAUTHENTICATED_ERROR } from "../../../src/constants";
import { errors } from "../../../src/libraries";

describe("libraries -> errors -> unauthenticatedError", () => {
  it(`throws unauthenticatedError if user not authenticated`, () => {
    try {
      throw new errors.UnauthenticatedError(
        UNAUTHENTICATED_ERROR.MESSAGE,
        UNAUTHENTICATED_ERROR.CODE,
        UNAUTHENTICATED_ERROR.PARAM,
      );
    } catch (error: unknown) {
      expect((error as errors.InternalServerError).errors).toEqual([
        expect.objectContaining({
          message: UNAUTHENTICATED_ERROR.MESSAGE,
          code: UNAUTHENTICATED_ERROR.CODE,
          param: UNAUTHENTICATED_ERROR.PARAM,
        }),
      ]);
    }
  });
});
