import "dotenv/config";
import { describe, it, expect } from "vitest";
import { errors } from "../../../src/libraries";

describe("libraries -> errors -> unauthenticatedError", () => {
  it(`throws unauthenticatedError if user not authenticated`, async () => {
    try {
      throw new errors.UnauthenticatedError(
        "UnauthenticatedError",
        "user.notAuthenticated",
        "userAuthentication"
      );
    } catch (error: any) {
      expect(error.errors).toEqual([
        expect.objectContaining({
          message: "UnauthenticatedError",
          code: "user.notAuthenticated",
          param: "userAuthentication",
        }),
      ]);
    }
  });
});
