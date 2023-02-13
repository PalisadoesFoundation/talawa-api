import "dotenv/config";
import { blockedUsers as blockedUsersResolver } from "../../../src/resolvers/Organization/blockedUsers";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
import { User } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestUserAndOrganization,
  testOrganizationType,
} from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testOrganization: testOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const userAndOrg = await createTestUserAndOrganization();
  testOrganization = userAndOrg[1];
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Organization -> blockedUsers", () => {
  it(`returns all user objects for parent.blockedUsers`, async () => {
    const parent = testOrganization!.toObject();

    const blockedUsersPayload = await blockedUsersResolver?.(parent, {}, {});

    const blockedUsers = await User.find({
      _id: {
        $in: testOrganization!.blockedUsers,
      },
    }).lean();

    expect(blockedUsersPayload).toEqual(blockedUsers);
  });
});
