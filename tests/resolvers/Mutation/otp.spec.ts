import "dotenv/config";
import type { MutationOtpArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { otp as otpResolver } from "../../../src/resolvers/Mutation/otp";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import { mailer } from "../../../src/utilities";
import { USER_NOT_FOUND_ERROR } from "../../../src/constants";
import { nanoid } from "nanoid";

let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
});
afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> otp", () => {
  it("throws Error if no user exists with email === args.data.email", async () => {
    try {
      const args: MutationOtpArgs = {
        data: {
          email: `email${nanoid().toLowerCase()}@gmail.com`,
        },
      };

      await otpResolver?.({}, args, {});
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.DESC);
    }
  });
  it("should generate and send OTP to the user", async () => {
    const args: MutationOtpArgs = {
      data: {
        email: testUser?.email,
      },
    };
    vi.mock("../../../src/utilities", () => ({
      mailer: vi.fn().mockResolvedValue({ message: "success" }),
    }));

    vi.doMock("../../../src/constants", async () => {
      const actualConstants: object = await vi.importActual(
        "../../../src/constants",
      );

      return {
        ...actualConstants,
        ACCESS_TOKEN_SECRET: "mysecret",
        USER_NOT_FOUND_ERROR: { DESC: "User not found" },
      };
    });

    const res = await otpResolver?.({}, args, {});
    const otpToken = res?.otpToken;
    expect(res).toHaveProperty("otpToken");
    expect(otpToken).not.toBeNull();
    expect(mailer).toHaveBeenCalled();
  });
});
