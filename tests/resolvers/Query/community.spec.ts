import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import { community } from "../../../src/resolvers/Query/community";
import { errors } from "../../../src/libraries";

import { connect, disconnect } from "../../helpers/db";
import { createTestUserWithUserTypeFunc } from "../../helpers/user";
import { createTestCommunityFunc } from "../../helpers/community";
import type { TestCommunityType } from "../../helpers/community";
import type { TestUserType } from "../../helpers/user";
import {
  BASE_URL,
  COMMUNITY_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { Community } from "../../../src/models";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testUser2: TestUserType;
let testCommunity: TestCommunityType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  testUser = await createTestUserWithUserTypeFunc("SUPERADMIN");
  testUser2 = await createTestUserWithUserTypeFunc("ADMIN");
  testCommunity = await createTestCommunityFunc();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> community", () => {
  test("should throw NotFoundError if user does not exist", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);
    const context = { userId: Types.ObjectId().toString() };
    const args = {};

    await expect(community?.({}, args, context)).rejects.toThrow(
      errors.NotFoundError
    );
    expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
  });

  test("should throw AuthorizationError if user is not a super admin", async () => {
    const context = { userId: testUser2?._id.toString() };
    const args = {};

    await expect(community?.({}, args, context)).rejects.toThrow(
      errors.UnauthorizedError
    );
  });

  test("should return community data if community exists", async () => {
    const context = { userId: testUser?._id.toString(), apiRootUrl: BASE_URL };
    const args = {};

    const result = await community?.({}, args, context);
    expect(result).toEqual({
      ...testCommunity?.toObject(),
      _id: testCommunity?._id.toString(),
      image: testCommunity?.image
        ? `${context.apiRootUrl}${testCommunity?.image}`
        : null,
    });
  });

  test("should return null if community image does not exist", async () => {
    await Community.findByIdAndUpdate(testCommunity?._id, {
      $unset: { image: "" },
    });
    const context = {
      userId: testUser?._id.toString(),
      apiRootUrl: "http://localhost:4000",
    };
    const args = {};

    const result = await community?.({}, args, context);
    expect(result?.image).toBeNull();
  });

  test("should throw NotFoundError if community does not exist", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);
    const context = { userId: testUser?._id.toString() };
    const args = {};

    await Community.deleteMany({});

    await expect(community?.({}, args, context)).rejects.toThrow(
      errors.NotFoundError
    );

    expect(spy).toHaveBeenCalledWith(COMMUNITY_NOT_FOUND_ERROR.MESSAGE);
  });
});
