import "dotenv/config";
import { Document } from "mongoose";
import { Interface_User, User } from "../../../src/lib/models";
import { MutationForgotPasswordArgs } from "../../../src/generated/graphqlCodegen";
import { connect, disconnect } from "../../../src/db";
import { forgotPassword as forgotPasswordResolver } from "../../../src/lib/resolvers/Mutation/forgotPassword";
import { INVALID_OTP } from "../../../src/constants";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUser: Interface_User & Document<any, any, Interface_User>;

beforeAll(async () => {
  await connect();

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> forgotPassword", () => {
  it(`throws Error if args.otp is incorrect`, async () => {
    try {
      const otpToken = jwt.sign(
        {
          email: testUser.email,
          otp: "otp",
        },
        "testSecret",
        {
          expiresIn: 99999999,
        }
      );

      const args: MutationForgotPasswordArgs = {
        data: {
          newPassword: "newPassword",
          otpToken,
          userOtp: "wrongOtp",
        },
      };

      await forgotPasswordResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(INVALID_OTP);
    }
  });

  it(`changes the password if args.otp is correct`, async () => {
    const otp = "otp";

    const hashedOtp = await bcrypt.hash(otp, 1);

    const otpToken = jwt.sign(
      {
        email: testUser.email,
        otp: hashedOtp,
      },
      "testSecret",
      {
        expiresIn: 99999999,
      }
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

    const updatedTestUser = await User.findOne({
      _id: testUser._id,
    })
      .select(["password"])
      .lean();

    expect(updatedTestUser?.password).not.toEqual(testUser.password);
  });
});
