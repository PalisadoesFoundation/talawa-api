import "dotenv/config";
import type {
  MutationForgotPasswordArgs,
  TransactionLog,
} from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { forgotPassword as forgotPasswordResolver } from "../../../src/resolvers/Mutation/forgotPassword";
import { INVALID_OTP, TRANSACTION_LOG_TYPES } from "../../../src/constants";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestUserFunc } from "../../helpers/user";
import { User } from "../../../src/models";
import { wait } from "./acceptAdmin.spec";
import { getTransactionLogs } from "../../../src/resolvers/Query/getTransactionLogs";

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
        process.env.NODE_ENV!,
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
        email: testUser?.email ?? "",
        otp: hashedOtp,
      },
      process.env.NODE_ENV ?? "",
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

    const updatedTestUser = await User!
      .findOne({
        _id: testUser?._id ?? "",
      })
      .select(["password"])
      .lean();

    expect(updatedTestUser?.password).not.toEqual(testUser!.password);

    await wait();

    const mostRecentTransactions = getTransactionLogs!({}, {}, {})!;

    expect((mostRecentTransactions as TransactionLog[])[0]).toMatchObject({
      createdBy: testUser?._id.toString(),
      type: TRANSACTION_LOG_TYPES.UPDATE,
      model: "User",
    });
  });
});
