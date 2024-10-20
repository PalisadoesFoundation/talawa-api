import "dotenv/config";
import { blockedUsers as blockedUsersResolver } from "../../../src/resolvers/Organization/blockedUsers";
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

      try {
        const decryptedBlockedUsers = blockedUsers.map((user) => ({
          ...user,
          email: decryptEmail(user.email).decrypted,
        }));

        expect(blockedUsersPayload).toEqual(decryptedBlockedUsers);
        expect(
          decryptedBlockedUsers.every(
            (user) =>
              user.email !== blockedUsers.find((u) => u._id == user._id)?.email,
          ),
        ).toBe(true);
      } catch (error) {
        console.error("Error decrypting emails:", error);
        throw error;
      }
    }
  });
});
