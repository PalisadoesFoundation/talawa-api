import "dotenv/config";
import { user as userResolver } from "../../../src/resolvers/Query/user";
import { connect, disconnect } from "../../../src/db";
import { USER_NOT_FOUND } from "../../../src/constants";
import { User } from "../../../src/models";
import { Types } from "mongoose";
import { QueryUserArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { testUserType, testOrganizationType, createTestUserAndOrganization } from "../../helpers/userAndOrg";

let testUser: testUserType;
let testOrganization: testOrganizationType;

beforeAll(async () => {
  await connect();
  [testUser, testOrganization] = await createTestUserAndOrganization();
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Query -> user", () => {
  it("throws NotFoundError if no user exists with _id === args.id", async () => {
    try {
      const args: QueryUserArgs = {
        id: Types.ObjectId().toString(),
      };

      await userResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`returns user object`, async () => {
    const args: QueryUserArgs = {
      id: testUser.id,
    };

    const context = {
      userId: testUser.id,
    };

    const userPayload = await userResolver?.({}, args, context);

    const user = await User.findOne({
      _id: testUser._id,
    })
      .populate("adminFor")
      .lean();

    expect(userPayload).toEqual({
      ...user,
      organizationsBlockedBy: [],
    });
  });
});
