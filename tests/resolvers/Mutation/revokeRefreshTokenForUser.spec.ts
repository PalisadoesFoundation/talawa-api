import "dotenv/config";
import { User } from "../../../src/models";
import { MutationRevokeRefreshTokenForUserArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { revokeRefreshTokenForUser as revokeRefreshTokenForUserResolver } from "../../../src/resolvers/Mutation/revokeRefreshTokenForUser";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestUserFunc, testUserType } from "../../helpers/user";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testUser: testUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUserFunc();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Mutation -> revokeRefreshTokenForUser", () => {
  it(`revokes refresh token for the user and returns true`, async () => {
    const args: MutationRevokeRefreshTokenForUserArgs = {
      userId: testUser!.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const revokeRefreshTokenForUserPayload =
      await revokeRefreshTokenForUserResolver?.({}, args, context);

    expect(revokeRefreshTokenForUserPayload).toEqual(true);

    const testSaveFcmTokenPayload = await User.findOne({
      _id: testUser!._id,
    })
      .select("tokenVersion")
      .lean();

    expect(testSaveFcmTokenPayload?.tokenVersion).toEqual(
      testUser!.tokenVersion + 1
    );
  });
});
