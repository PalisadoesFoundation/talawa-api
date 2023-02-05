import "dotenv/config";
import { blockedUsers as blockedUsersResolver } from "../../../src/resolvers/Organization/blockedUsers";
import { connect, disconnect } from "../../../src/db";
import { User } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestUserAndOrganization,
  testOrganizationType,
} from "../../helpers/userAndOrg";

let testOrganization: testOrganizationType;

beforeAll(async () => {
  await connect("TALAWA_TESTING_DB");
  const userAndOrg = await createTestUserAndOrganization();
  testOrganization = userAndOrg[1];
});

afterAll(async () => {
  await disconnect();
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
