import "dotenv/config";
import { user as userResolver } from "../../../src/resolvers/MembershipRequest/user";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { User } from "../../../src/models";
import type { TestMembershipRequestType } from "../../helpers/membershipRequests";
import { createTestMembershipRequest } from "../../helpers/membershipRequests";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { decryptEmail } from "../../../src/utilities/encryptionModule";
import { NotFoundError } from "../../../src/libraries/errors";

let testMembershipRequest: TestMembershipRequestType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestMembershipRequest();
  testMembershipRequest = temp[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> MembershipRequest -> user", () => {
  it(`returns user object for parent.user`, async () => {
    // eslint-disable-next-line
    const parent = testMembershipRequest!.toObject();

    const userPayload = await userResolver?.(parent, {}, {});
    // eslint-disable-next-line
    const user = await User.findOne({
      // eslint-disable-next-line
      _id: testMembershipRequest!.user,
    }).lean();

    if (!user) {
      throw new Error("User not found");
    }
    const { decrypted } = decryptEmail(user.email);
    user.email = decrypted;

    expect(userPayload).toEqual(user);
  });
  it(`throws error when user not found.`, async () => {
    // eslint-disable-next-line
    const parent = testMembershipRequest!.toObject()._id;
    // eslint-disable-next-line
    await expect(userResolver?.(parent, {}, {})).rejects.toThrowError(
      NotFoundError
    );
  });
});
