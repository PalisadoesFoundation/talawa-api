import "dotenv/config";
import { admins as adminsResolver } from "../../../src/resolvers/Organization/admins";
import { connect, disconnect } from "../../../src/db";
import { User } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestUserAndOrganization,
  testOrganizationType,
} from "../../helpers/userAndOrg";

let testOrganization: testOrganizationType;

beforeAll(async () => {
  await connect("TALAWA_TESING_DB");
  const userAndOrg = await createTestUserAndOrganization();
  testOrganization = userAndOrg[1];
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Organization -> admins", () => {
  it(`returns all user objects for parent.admins`, async () => {
    const parent = testOrganization!.toObject();

    const adminsPayload = await adminsResolver?.(parent, {}, {});

    const admins = await User.find({
      _id: {
        $in: testOrganization!.admins,
      },
    }).lean();

    expect(adminsPayload).toEqual(admins);
  });
});
