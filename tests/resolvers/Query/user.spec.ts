import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { USER_NOT_FOUND_ERROR } from "../../../src/constants";
import { User } from "../../../src/models";
import { user as userResolver } from "../../../src/resolvers/Query/user";
import { connect, disconnect } from "../../helpers/db";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { deleteUserFromCache } from "../../../src/services/UserCache/deleteUserFromCache";
import type { QueryUserArgs } from "../../../src/types/generatedGraphQLTypes";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import { FundraisingCampaignPledge } from "../../../src/models/FundraisingCampaignPledge";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = (await createTestUserAndOrganization())[0];
  await deleteUserFromCache(testUser?.id);
  const pledges = await FundraisingCampaignPledge.find({
    _id: new Types.ObjectId(),
  }).lean();
  console.log(pledges);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> user", () => {
  it("throws NotFoundError if no user exists with _id === args.id", async () => {
    try {
      const args: QueryUserArgs = {
        id: new Types.ObjectId().toString(),
      };

      await userResolver?.({}, args, {});
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.DESC);
    }
  });

  it(`returns user object without image`, async () => {
    const args: QueryUserArgs = {
      id: testUser?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    const userPayload = await userResolver?.({}, args, context);

    const user = await User.findOne({
      _id: testUser?._id,
    }).lean();

    expect(userPayload?.user).toEqual({
      ...user,
      organizationsBlockedBy: [],
      image: null,
    });
  });
});
