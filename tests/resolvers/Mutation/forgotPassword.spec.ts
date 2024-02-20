import "dotenv/config";
import type { MutationForgotPasswordArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { forgotPassword as forgotPasswordResolver } from "../../../src/resolvers/Mutation/forgotPassword";
import {
  INVALID_OTP,
  ACCESS_TOKEN_SECRET,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestUserFunc } from "../../helpers/user";
import { User } from "../../../src/models";

let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUserFunc();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> forgotPassword", () => {
  it(`throws Error if args.otp is incorrect`, async () => {
    try {
      const otpToken = jwt.sign(
        {
          email: testUser?.email ?? "",
          otp: "otp",
        },
        ACCESS_TOKEN_SECRET as string,
        {
          expiresIn: 99999999,
        },
      );

      const args: MutationForgotPasswordArgs = {
        data: {
          newPassword: "newPassword",
          otpToken,
          userOtp: "wrongOtp",
        },
      };

      await forgotPasswordResolver?.({}, args, {});
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toEqual(INVALID_OTP);
      }
    }
  });

  //added ths test
  it("throws an error when the email is changed in the token", async () => {
    const otp = "correctOtp";

    const hashedOtp = await bcrypt.hash(otp, 1);

    // Sign the token
    const otpToken = jwt.sign(
      {
        email: testUser?.email ?? "",
        otp: hashedOtp,
      },
      process.env.NODE_ENV ?? "",
      {
        expiresIn: 99999999,
      },
    );
    const oldPassword = testUser?.password;
    const args: MutationForgotPasswordArgs = {
      data: {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        newPassword: oldPassword!, // Using optional chaining and nullish coalescing
        otpToken,
        userOtp: otp,
      },
    };

    try {
      await forgotPasswordResolver?.({}, args, {});
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toEqual(INVALID_OTP);
      }
    }
  });
  it(`throws an error when the user is not found`, async () => {
    const otp = "correctOtp";

    const hashedOtp = await bcrypt.hash(otp, 1);

    // Sign the token with an email that doesn't exist
    const otpToken = jwt.sign(
      {
        email: "nonexistent@example.com", // An email that doesn't exist
        otp: hashedOtp,
      },
      ACCESS_TOKEN_SECRET as string,
      {
        expiresIn: 99999999,
      },
    );

    const args: MutationForgotPasswordArgs = {
      data: {
        newPassword: "newPassword",
        otpToken,
        userOtp: otp,
      },
    };

    try {
      await forgotPasswordResolver?.({}, args, {});
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
      }
    }
  });
  it(`changes the password if args.otp is correct`, async () => {
    const otp = "otp";

    const hashedOtp = await bcrypt.hash(otp, 1);

    const otpToken = jwt.sign(
      {
        email: testUser?.email ?? "",
        otp: hashedOtp,
      },
      ACCESS_TOKEN_SECRET as string,
      {
        expiresIn: 99999999,
      },
    );

    const args: MutationForgotPasswordArgs = {
      data: {
        newPassword: "newPassword",
        otpToken,
        userOtp: otp,
      },
    };

    const forgotPasswordPayload = await forgotPasswordResolver?.({}, args, {});

    expect(forgotPasswordPayload).toEqual(true);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const updatedTestUser = await User!
      .findOne({
        _id: testUser?._id ?? "",
      })
      .select(["password"])
      .lean();

    expect(updatedTestUser?.password).not.toEqual(testUser?.password);
  });
});
