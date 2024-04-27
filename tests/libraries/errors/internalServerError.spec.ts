import "dotenv/config";
import { describe, it, expect } from "vitest";
import { INTERNAL_SERVER_ERROR } from "../../../src/constants";
import { errors } from "../../../src/libraries";

describe("libraries -> errors -> internalServerError", () => {
  it(`throws internalServerError if there is error from the server side `, () => {
    try {
      throw new errors.InternalServerError(
        INTERNAL_SERVER_ERROR.MESSAGE,
        INTERNAL_SERVER_ERROR.CODE,
        INTERNAL_SERVER_ERROR.PARAM,
      );
    } catch (error: unknown) {
      expect((error as errors.InternalServerError).errors).toEqual([
        expect.objectContaining({
          message: INTERNAL_SERVER_ERROR.MESSAGE,
          code: INTERNAL_SERVER_ERROR.CODE,
          param: INTERNAL_SERVER_ERROR.PARAM,
        }),
      ]);
    }
  });
});
