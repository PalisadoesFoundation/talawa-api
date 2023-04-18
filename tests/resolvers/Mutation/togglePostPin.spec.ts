import "dotenv/config";
import mongoose, { Types } from "mongoose";
import { Organization, User, Post } from "../../../src/models";
import { MutationTogglePostPinArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  POST_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_TO_PIN,
} from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  vi,
  afterEach,
} from "vitest";
import { createTestPost, TestPostType } from "../../helpers/posts";
import { createTestUser, TestUserType } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let randomUser: TestUserType;
let testPost: TestPostType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , testPost] = await createTestPost();
  randomUser = await createTestUser();

  // Done so as to fetch the latest changes in the adminFor field of the user
  testUser = await User.findOne({
    _id: testUser?._id,
  }).lean();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> togglePostPin", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
    vi.resetAllMocks();
  });

  it(`throws NotFoundError if current user with _id === context.userId does not exist`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`
    );

    try {
      const args: MutationTogglePostPinArgs = {
        id: testPost?._id,
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { togglePostPin: togglePostPinResolver } = await import(
        "../../../src/resolvers/Mutation/togglePostPin"
      );

      await togglePostPinResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws NotFoundError if no post exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`
    );

    try {
      const args: MutationTogglePostPinArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?._id,
      };

      const { togglePostPin: togglePostPinResolver } = await import(
        "../../../src/resolvers/Mutation/togglePostPin"
      );

      await togglePostPinResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${POST_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws NotAuthorized error if the user is not the admin of the org or a superadmin`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);
    try {
      const args: MutationTogglePostPinArgs = {
        id: testPost?.id,
      };

      const context = {
        userId: randomUser?._id,
      };

      const { togglePostPin: togglePostPinResolver } = await import(
        "../../../src/resolvers/Mutation/togglePostPin"
      );

      await togglePostPinResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_TO_PIN.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_TO_PIN.MESSAGE}`
      );
    }
  });

  it(`adds a post to the pinnedPosts for an org`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`
    );
    const args: MutationTogglePostPinArgs = {
      id: testPost?._id,
    };

    const context = {
      userId: testUser?._id,
    };

    const { togglePostPin: togglePostPinResolver } = await import(
      "../../../src/resolvers/Mutation/togglePostPin"
    );

    await togglePostPinResolver?.({}, args, context);
    const organization = await Organization.findOne({
      _id: testPost?.organization,
    }).lean();
    const updatedPost = await Post.findOne({
      _id: testPost?.id,
    }).lean();

    const currentPostIsPinned = organization?.pinnedPosts.some((p) =>
      p.equals(args.id)
    );

    expect(currentPostIsPinned).toBeTruthy();
    expect(updatedPost?.pinned).toBeTruthy();
  });

  it(`removes a post from the pinnedPosts for an org`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`
    );

    const args: MutationTogglePostPinArgs = {
      id: testPost?._id,
    };

    const context = {
      userId: testUser?._id,
    };

    const { togglePostPin: togglePostPinResolver } = await import(
      "../../../src/resolvers/Mutation/togglePostPin"
    );

    await togglePostPinResolver?.({}, args, context);

    const organization = await Organization.findOne({
      _id: testPost?.organization,
    }).lean();
    const updatedPost = await Post.findOne({
      _id: testPost?.id,
    }).lean();

    const currentPostIsPinned = organization?.pinnedPosts.some((p) =>
      p.equals(args.id)
    );

    expect(currentPostIsPinned).toBeFalsy();
    expect(updatedPost?.pinned).toBeFalsy();
  });
});
