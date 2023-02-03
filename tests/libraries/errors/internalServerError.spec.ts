import "dotenv/config";
import { describe, it, expect } from "vitest";
import { errors } from "../../../src/libraries";

describe("libraries -> errors -> internalServerError", () => {
  it(`throws internalServerError if there is error from the server side `, async () => {
    try {
      throw new errors.InternalServerError(
        "Internal Server Error!",
        "internalServerError",
        "internalServerError"
      );
    } catch (error: any) {
      expect(error.errors).toEqual([
        expect.objectContaining({
          message: "Internal Server Error!",
          code: "internalServerError",
          param: "internalServerError",
        }),
      ]);
    }
  });
});
