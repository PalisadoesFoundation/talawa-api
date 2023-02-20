import "dotenv/config";
import { Types } from "mongoose";
import { Post } from "../../../src/models";
import { MutationUnlikePostArgs } from "../../../src/types/generatedGraphQLTypes";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
import { unlikePost as unlikePostResolver } from "../../../src/resolvers/Mutation/unlikePost";
import { POST_NOT_FOUND, USER_NOT_FOUND } from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestUserAndOrganization,
  testUserType,
} from "../../helpers/userAndOrg";
import { testPostType } from "../../helpers/posts";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testUser: testUserType;
let testPost: testPostType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
  const testOrganization = temp[1];

  testPost = await Post.create({
    text: "text",
    creator: testUser!._id,
    organization: testOrganization!._id,
    likedBy: [testUser!._id],
    likeCount: 1,
  });
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Mutation -> unlikePost", () => {
  it(`throws NotFoundError if current user with _id === context.userId does not exist`, async () => {
    try {
      const args: MutationUnlikePostArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await unlikePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no post exists with _id === args.id`, async () => {
    try {
      const args: MutationUnlikePostArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!._id,
      };

      await unlikePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(POST_NOT_FOUND);
    }
  });

  it(`removes current user with _id === context.userId from likedBy list
  on post with _id === args.id`, async () => {
    const args: MutationUnlikePostArgs = {
      id: testPost!._id,
    };

    const context = {
      userId: testUser!._id,
    };

    const unlikePostPayload = await unlikePostResolver?.({}, args, context);

    const testUnlikePostPayload = await Post.findOne({
      _id: testPost!._id,
    }).lean();

    expect(unlikePostPayload).toEqual(testUnlikePostPayload);
  });

  it(`returns the post with _id === args.id without any mutation if current user
  with _id === context.userId does not exist in likedBy list of the post`, async () => {
    const args: MutationUnlikePostArgs = {
      id: testPost!._id,
    };

    const context = {
      userId: testUser!._id,
    };

    const unlikePostPayload = await unlikePostResolver?.({}, args, context);

    const testUnlikePostPayload = await Post.findOne({
      _id: testPost!._id,
    }).lean();

    expect(unlikePostPayload).toEqual(testUnlikePostPayload);
  });
});
