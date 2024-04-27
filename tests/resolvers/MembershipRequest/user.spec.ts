import "dotenv/config";
import { user as userResolver } from "../../../src/resolvers/MembershipRequest/user";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User } from "../../../src/models";
import type { TestMembershipRequestType } from "../../helpers/membershipRequests";
import { createTestMembershipRequest } from "../../helpers/membershipRequests";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { USER_NOT_FOUND_ERROR } from "../../../src/constants";

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
    const parent = testMembershipRequest?.toObject();
    if (!parent) {
      throw new Error("Parent object is undefined.");
    }
    const userPayload = await userResolver?.(parent, {}, {});

    const user = await User.findOne({
      _id: testMembershipRequest?.user,
    }).lean();

    expect(userPayload).toEqual(user);
  });
  it(`throws NotFoundError if no user exists`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);

    const parent = {
      ...testMembershipRequest?.toObject(),
      user: new Types.ObjectId(), // Set to a non-existing ObjectId
    };

    if (!parent) {
      throw new Error("Parent object is undefined.");
    }

    try {
      if (userResolver) {
        // @ts-expect-error - Testing for error
        await userResolver(parent, {}, {});
      }
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
});
