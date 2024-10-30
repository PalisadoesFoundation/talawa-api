import "dotenv/config";
import { members as membersResolver } from "../../../src/resolvers/Organization/members";
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

describe("resolvers -> Organization -> members", () => {
  it(`returns all user objects for parent.members`, async () => {
    const parent = testOrganization?.toObject();
    if (parent) {
      const membersPayload = await membersResolver?.(parent, {}, {});
      const members = await User.find({
        _id: {
          $in: testOrganization?.members,
        },
      }).lean();

      for (const member of members) {
        const { decrypted } = decryptEmail(member.email);
        member.email = decrypted;
      }

      expect(membersPayload).toEqual(members);
    }
  });
});
