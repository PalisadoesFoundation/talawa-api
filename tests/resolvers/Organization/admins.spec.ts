import "dotenv/config";
import { admins as adminsResolver } from "../../../src/resolvers/Organization/admins";
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
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  const userAndOrg = await createTestUserAndOrganization();
  testOrganization = userAndOrg[1];
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
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
