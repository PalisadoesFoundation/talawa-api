import "dotenv/config";
import { members as membersResolver } from "../../../src/resolvers/Organization/members";
import { connect, disconnect } from "../../../src/db";
import { User } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestUserAndOrganization,
  testOrganizationType,
} from "../../helpers/userAndOrg";

let testOrganization: testOrganizationType;

beforeAll(async () => {
  await connect();
  const userAndOrg = await createTestUserAndOrganization();
  testOrganization = userAndOrg[1];
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Organization -> members", () => {
  it(`returns all user objects for parent.members`, async () => {
    const parent = testOrganization!.toObject();

    const membersPayload = await membersResolver?.(parent, {}, {});

    const members = await User.find({
      _id: {
        $in: testOrganization!.members,
      },
    }).lean();

    expect(membersPayload).toEqual(members);
  });
});
