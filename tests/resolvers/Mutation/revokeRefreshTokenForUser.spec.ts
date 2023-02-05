import "dotenv/config";
import { User } from "../../../src/models";
import { MutationRevokeRefreshTokenForUserArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { revokeRefreshTokenForUser as revokeRefreshTokenForUserResolver } from "../../../src/resolvers/Mutation/revokeRefreshTokenForUser";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestUserFunc, testUserType } from "../../helpers/user";

let testUser: testUserType;

beforeAll(async () => {
  await connect("TALAWA_TESTING_DB");
  testUser = await createTestUserFunc();
});

afterAll(async () => {
  await disconnect();
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
