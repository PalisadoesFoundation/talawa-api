import "dotenv/config";
import { Types } from "mongoose";
import { Post } from "../../../src/models";
import { MutationUpdatePostArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { updatePost as updatePostResolver } from "../../../src/resolvers/Mutation/updatePost";
import {
  POST_NOT_FOUND_MESSAGE,
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_FOUND_MESSAGE,
} from "../../../src/constants";
import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { testUserType } from "../../helpers/userAndOrg";
import { createTestPost, testPostType } from "../../helpers/posts";

let testUser: testUserType;
let testPost: testPostType;

beforeEach(async () => {
  await connect();
  const temp = await createTestPost();
  testUser = temp[0];
  testPost = temp[2];
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message
  );
});
afterEach(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> updatePost", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationUpdatePostArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await updatePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_MESSAGE);
    }
  });

  it(`throws NotFoundError if no post exists with _id === args.id`, async () => {
    try {
      const args: MutationUpdatePostArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!._id,
      };

      await updatePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(POST_NOT_FOUND_MESSAGE);
    }
  });

  it(`throws UnauthorizedError as current user with _id === context.userId is
  not an creator of post with _id === args.id`, async () => {
    try {
      const args: MutationUpdatePostArgs = {
        id: testPost!._id,
      };

      const context = {
        userId: testUser!._id,
      };

      await Post.updateOne(
        { _id: testPost!._id },
        { $set: { creator: Types.ObjectId().toString() } }
      );

      await updatePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_MESSAGE);
    }
  });

  it(`updates the post with _id === args.id and returns the updated post`, async () => {
    const args: MutationUpdatePostArgs = {
      id: testPost!._id,
      data: {
        title: "newTitle",
        text: "nextText",
      },
    };

    const context = {
      userId: testUser!._id,
    };

    const updatePostPayload = await updatePostResolver?.({}, args, context);

    const testUpdatePostPayload = await Post.findOne({
      _id: testPost!._id,
    }).lean();

    expect(updatePostPayload).toEqual(testUpdatePostPayload);
  });
});
