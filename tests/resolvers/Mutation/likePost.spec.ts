import "dotenv/config";
import { Types } from "mongoose";
import { MutationLikePostArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { likePost as likePostResolver } from "../../../src/resolvers/Mutation/likePost";
import { POST_NOT_FOUND, USER_NOT_FOUND } from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { testUserType } from "../../helpers/userAndOrg";
import { createTestPost, testPostType } from "../../helpers/posts";

let testUser: testUserType;
let testPost: testPostType;

beforeAll(async () => {
  await connect("TALAWA_TESTING_DB");
  const temp = await createTestPost();
  testUser = temp[0];
  testPost = temp[2];
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> likePost", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationLikePostArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await likePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no post exists with _id === args.id`, async () => {
    try {
      const args: MutationLikePostArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!.id,
      };

      await likePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(POST_NOT_FOUND);
    }
  });

  it(`updates likedBy and likeCount fields on post object with _id === args.id and
  returns it `, async () => {
    const args: MutationLikePostArgs = {
      id: testPost!.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const likePostPayload = await likePostResolver?.({}, args, context);

    expect(likePostPayload?.likedBy).toEqual([testUser!._id]);
    expect(likePostPayload?.likeCount).toEqual(1);
  });

  it(`returns post object with _id === args.id without liking the post if user with
  _id === context.userId has already liked it.`, async () => {
    const args: MutationLikePostArgs = {
      id: testPost!.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const likePostPayload = await likePostResolver?.({}, args, context);

    expect(likePostPayload?.likedBy).toEqual([testUser!._id]);
    expect(likePostPayload?.likeCount).toEqual(1);
  });
});
