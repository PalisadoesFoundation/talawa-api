import "dotenv/config";
import { user as userResolver } from "../../../src/resolvers/MembershipRequest/user";
import { connect, disconnect } from "../../../src/db";
import { User } from "../../../src/models";
import {
  testMembershipRequestType,
  createTestMembershipRequest,
} from "../../helpers/membershipRequests";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testMembershipRequest: testMembershipRequestType;

beforeAll(async () => {
  await connect();
  const temp = await createTestMembershipRequest();
  testMembershipRequest = temp[2];
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> MembershipRequest -> user", () => {
  it(`returns user object for parent.user`, async () => {
    const parent = testMembershipRequest!.toObject();

    const userPayload = await userResolver?.(parent, {}, {});

    const user = await User.findOne({
      _id: testMembershipRequest!.user,
    }).lean();

    expect(userPayload).toEqual(user);
  });
});
