import "dotenv/config";
import { TransactionLog, User } from "../../../src/models";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { revokeRefreshTokenForUser as revokeRefreshTokenForUserResolver } from "../../../src/resolvers/Mutation/revokeRefreshTokenForUser";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestUserType } from "../../helpers/user";
import { createTestUserFunc } from "../../helpers/user";
import { wait } from "./acceptAdmin.spec";
import { TRANSACTION_LOG_TYPES } from "../../../src/constants";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUserFunc();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> revokeRefreshTokenForUser", () => {
  it(`revokes refresh token for the user and returns true`, async () => {
    const args = {};

    const context = {
      userId: testUser?.id,
    };

    const revokeRefreshTokenForUserPayload =
      await revokeRefreshTokenForUserResolver?.({}, args, context);

    expect(revokeRefreshTokenForUserPayload).toEqual(true);

    const testSaveFcmTokenPayload = await User.findOne({
      _id: testUser?._id,
    })
      .select("token")
      .lean();

    expect(testSaveFcmTokenPayload?.token).toEqual(undefined);

    await wait();

    const mostRecentTransactions = await TransactionLog.find()
      .sort({
        createdAt: -1,
      })
      .limit(1);

    expect(mostRecentTransactions[0]).toMatchObject({
      createdBy: testUser?._id,
      type: TRANSACTION_LOG_TYPES.UPDATE,
      modelName: "User",
    });
  });
});
