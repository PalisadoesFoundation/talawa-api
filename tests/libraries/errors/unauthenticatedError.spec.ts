import "dotenv/config";
import { describe, it, expect } from "vitest";
import { UNAUTHENTICATED_ERROR } from "../../../src/constants";
import { errors } from "../../../src/libraries";

describe("libraries -> errors -> unauthenticatedError", () => {
  it(`throws unauthenticatedError if user not authenticated`, async () => {
    try {
      throw new errors.UnauthenticatedError(
        UNAUTHENTICATED_ERROR.message,
        UNAUTHENTICATED_ERROR.code,
        UNAUTHENTICATED_ERROR.param
      );
    } catch (error: any) {
      expect(error.errors).toEqual([
        expect.objectContaining({
          message: UNAUTHENTICATED_ERROR.message,
          code: UNAUTHENTICATED_ERROR.code,
          param: UNAUTHENTICATED_ERROR.param,
        }),
      ]);
    }
  });
});
