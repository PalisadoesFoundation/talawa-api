import type { MutationRecaptchaArgs } from "../../../src/types/generatedGraphQLTypes";
import { recaptcha as recaptchaResolver } from "../../../src/resolvers/Mutation/recaptcha";
import { describe, it, expect } from "vitest";

describe("resolvers -> Mutation -> recaptcha", () => {
  it("should not generate recaptcha with a dummy recaptcha token ", async () => {
    const args: MutationRecaptchaArgs = {
      data: {
        recaptchaToken: "dummyToken",
      },
    };

    const recaptchaPayload = await recaptchaResolver?.({}, args, {});

    expect(recaptchaPayload).toBeFalsy();
  });
});
