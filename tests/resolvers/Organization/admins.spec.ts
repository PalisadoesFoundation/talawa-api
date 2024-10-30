import "dotenv/config";
import { admins as adminsResolver } from "../../../src/resolvers/Organization/admins";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { User } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestOrganizationType } from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import { decryptEmail } from "../../../src/utilities/encryption";

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

describe("resolvers -> Organization -> admins", () => {
  it(`returns all user objects for parent.admins`, async () => {
    const parent = testOrganization?.toObject();
    if (parent) {
      const adminsPayload = await adminsResolver?.(parent, {}, {});

      const admins = await User.find({
        _id: {
          $in: testOrganization?.admins,
        },
      }).lean();

      for (const admin of admins) {
        const { decrypted } = decryptEmail(admin.email);
        admin.email = decrypted;
      }

      expect(adminsPayload).toEqual(admins);
    }
  });
});
