import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { AppUserProfile, Organization, Post, User } from "../../../src/models";
import type { MutationTogglePostPinArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  LENGTH_VALIDATION_ERROR,
  POST_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_TO_PIN,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import type { TestPostType } from "../../helpers/posts";
import { createTestPost } from "../../helpers/posts";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";

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
      (message) => `Translated ${message}`,
    );

    try {
      const args: MutationTogglePostPinArgs = {
        id: testPost?._id.toString() || "",
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      const { togglePostPin: togglePostPinResolver } = await import(
        "../../../src/resolvers/Mutation/togglePostPin"
      );

      await togglePostPinResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws NotFoundError if no post exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`,
    );

    try {
      const args: MutationTogglePostPinArgs = {
        id: new Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?._id,
      };

      const { togglePostPin: togglePostPinResolver } = await import(
        "../../../src/resolvers/Mutation/togglePostPin"
      );

      await togglePostPinResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${POST_NOT_FOUND_ERROR.MESSAGE}`,
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
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_TO_PIN.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_TO_PIN.MESSAGE}`,
      );
    }
  });

  it(`adds a post to the pinnedPosts for an org`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`,
    );
    const args: MutationTogglePostPinArgs = {
      id: testPost?._id.toString() || "",
      title: "Test title",
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
      p.equals(args.id),
    );

    expect(currentPostIsPinned).toBeTruthy();
    expect(updatedPost?.pinned).toBeTruthy();
  });

  it(`removes a post from the pinnedPosts for an org`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`,
    );

    const args: MutationTogglePostPinArgs = {
      id: testPost?._id.toString() || "",
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
      p.equals(args.id),
    );

    expect(currentPostIsPinned).toBeFalsy();
    expect(updatedPost?.pinned).toBeFalsy();
  });

  it("throws error if title is not provided to pin post", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => message,
    );
    try {
      const args: MutationTogglePostPinArgs = {
        id: testPost?._id.toString() || "",
      };

      const context = {
        userId: testUser?._id,
      };

      const { togglePostPin: togglePostPinResolver } = await import(
        "../../../src/resolvers/Mutation/togglePostPin"
      );

      await togglePostPinResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Please provide a title to pin post`,
      );
    }
  });

  it(`throws String Length Validation error if title is greater than 256 characters`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => message,
    );
    try {
      const args: MutationTogglePostPinArgs = {
        id: testPost?._id.toString() || "",
        title:
          "AfGtN9o7IJXH9Xr5P4CcKTWMVWKOOHTldleLrWfZcThgoX5scPE5o0jARvtVA8VhneyxXquyhWb5nluW2jtP0Ry1zIOUFYfJ6BUXvpo4vCw4GVleGBnoKwkFLp5oW9L8OsEIrjVtYBwaOtXZrkTEBySZ1prr0vFcmrSoCqrCTaChNOxL3tDoHK6h44ChFvgmoVYMSq3IzJohKtbBn68D9NfEVMEtoimkGarUnVBAOsGkKv0mIBJaCl2pnR8Xwq1cG1",
      };

      const context = {
        userId: testUser?._id,
      };

      const { togglePostPin: togglePostPinResolver } = await import(
        "../../../src/resolvers/Mutation/togglePostPin"
      );

      await togglePostPinResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `${LENGTH_VALIDATION_ERROR.MESSAGE} 256 characters in title`,
      );
    }
  });
  it("throws an error if user does not have appUserProfile", async () => {
    await AppUserProfile.deleteOne({
      user: testUser?._id,
    });
    const { requestContext } = await import("../../../src/libraries");

    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => message,
    );
    try {
      const args: MutationTogglePostPinArgs = {
        id: testPost?._id.toString() || "",
        title: "Test title",
      };

      const context = {
        userId: testUser?._id,
      };

      const { togglePostPin: togglePostPinResolver } = await import(
        "../../../src/resolvers/Mutation/togglePostPin"
      );

      await togglePostPinResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_TO_PIN.MESSAGE}`,
      );
    }
  });
  it("throws an error if user does not have appUserProfile", async () => {
    await AppUserProfile.deleteOne({
      user: testUser?._id,
    });
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => message,
    );
    const args: MutationTogglePostPinArgs = {
      id: testPost?._id.toString() || "",
      title: "Test title",
    };
    const context = {
      userId: testUser?._id,
    };
    try {
      const { togglePostPin: togglePostPinResolver } = await import(
        "../../../src/resolvers/Mutation/togglePostPin"
      );
      await togglePostPinResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `${USER_NOT_AUTHORIZED_TO_PIN.MESSAGE}`,
      );
    }
  });
});
