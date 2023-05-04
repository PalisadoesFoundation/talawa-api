import "dotenv/config";
import { blockedUsers as blockedUsersResolver } from "../../../src/resolvers/Organization/blockedUsers";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { User } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestOrganizationType } from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testOrganization: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const userAndOrg = await createTestUserAndOrganization();
  testOrganization = userAndOrg[1];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Organization -> blockedUsers", () => {
  it(`returns all user objects for parent.blockedUsers`, async () => {
    const parent = testOrganization?.toObject();
    if (parent) {
      const blockedUsersPayload = await blockedUsersResolver?.(parent, {}, {});
      const blockedUsers = await User.find({
        _id: {
          $in: testOrganization?.blockedUsers,
        },
      }).lean();

      expect(blockedUsersPayload).toEqual(blockedUsers);
    }
  });
});
