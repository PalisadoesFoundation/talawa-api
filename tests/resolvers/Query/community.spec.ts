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
    const args = { id: Types.ObjectId().toString() };

    await expect(community?.({}, args, context)).rejects.toThrow(
      errors.NotFoundError,
    );
    expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
  });

  test("should throw AuthorizationError if user is not a super admin", async () => {
    const context = { userId: testUser2?._id.toString() };
    const args = { id: Types.ObjectId().toString() };

    await expect(community?.({}, args, context)).rejects.toThrow(
      errors.UnauthorizedError,
    );
  });

  test("should return null if community logoUrl does not exist", async () => {
    await Community.findByIdAndUpdate(testCommunity?._id, {
      $unset: { logoUrl: "" },
    });
    const context = {
      userId: testUser?._id.toString(),
      apiRootUrl: "http://localhost:4000",
    };
    const args = { id: testCommunity?._id.toString() as string };

    const result = await community?.({}, args, context);
    expect(result?.logoUrl).toBeNull();
  });

  test("should return community data if community exists", async () => {
    const context = { userId: testUser?._id.toString(), apiRootUrl: BASE_URL };
    const args = { id: testCommunity?._id.toString() as string };

    await Community.findByIdAndUpdate(testCommunity?._id, {
      $set: { logoUrl: "test-image.jpg" },
    });

    const result = await community?.({}, args, context);
    delete result?.updatedAt;

    const expected = {
      ...testCommunity?.toObject(),
      _id: testCommunity?._id.toString(),
      name: testCommunity?.name,
      logoUrl: testCommunity?.logoUrl
        ? `${context.apiRootUrl}${testCommunity?.logoUrl}`
        : null,
      description: testCommunity?.description,
      timeout: testCommunity?.timeout,
      createdAt: testCommunity?.createdAt,
      websiteLink: testCommunity?.websiteLink,
    };
    delete expected?.updatedAt;

    expect(result).toEqual(expected);
  });

  test("should throw NotFoundError if community does not exist", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);
    const context = { userId: testUser?._id.toString() };
    const args = { id: testCommunity?._id.toString() as string };

    await Community.deleteMany({});

    await expect(community?.({}, args, context)).rejects.toThrow(
      errors.NotFoundError,
    );

    expect(spy).toHaveBeenCalledWith(COMMUNITY_NOT_FOUND_ERROR.MESSAGE);
  });
});
