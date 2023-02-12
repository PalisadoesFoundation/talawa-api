import "dotenv/config";
import { describe, it, expect } from "vitest";
import { INTERNAL_SERVER_ERROR } from "../../../src/constants";
import { errors } from "../../../src/libraries";

describe("libraries -> errors -> internalServerError", () => {
  it(`throws internalServerError if there is error from the server side `, async () => {
    try {
      throw new errors.InternalServerError(
        INTERNAL_SERVER_ERROR.message,
        INTERNAL_SERVER_ERROR.code,
        INTERNAL_SERVER_ERROR.param
      );
    } catch (error: any) {
      expect(error.errors).toEqual([
        expect.objectContaining({
          message: INTERNAL_SERVER_ERROR.message,
          code: INTERNAL_SERVER_ERROR.code,
          param: INTERNAL_SERVER_ERROR.param,
        }),
      ]);
    }
  });
});
