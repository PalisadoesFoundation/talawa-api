import "dotenv/config";
import { Document, Types } from "mongoose";
import { Post, Comment, InterfaceComment } from "../../../src/models";
import { MutationUnlikeCommentArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { unlikeComment as unlikeCommentResolver } from "../../../src/resolvers/Mutation/unlikeComment";
import {
  COMMENT_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { TestUserType } from "../../helpers/userAndOrg";
import { createTestPost } from "../../helpers/posts";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testComment: InterfaceComment & Document<any, any, InterfaceComment>;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestPost();
  testUser = temp[0];
  const testPost = temp[2];

  testComment = await Comment.create({
    text: "text",
    creator: testUser!._id,
    post: testPost!._id,
    likedBy: [testUser!._id],
    likeCount: 1,
  });

  await Post.updateOne(
    {
      _id: testPost!._id,
    },
    {
      $push: {
        comments: testComment._id,
      },
      $inc: {
        commentCount: 1,
      },
    }
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> unlikeComment", () => {
  it(`throws NotFoundError if current user with _id === context.userId does not exist`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationUnlikeCommentArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { unlikeComment: unlikeCommentResolver } = await import(
        "../../../src/resolvers/Mutation/unlikeComment"
      );

      await unlikeCommentResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no comment exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationUnlikeCommentArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!._id,
      };

      const { unlikeComment: unlikeCommentResolver } = await import(
        "../../../src/resolvers/Mutation/unlikeComment"
      );

      await unlikeCommentResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(COMMENT_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(COMMENT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`removes current user with _id === context.userId from likedBy list
    on comment with _id === args.id`, async () => {
    const args: MutationUnlikeCommentArgs = {
      id: testComment._id,
    };

    const context = {
      userId: testUser!._id,
    };

    const unlikeCommentPayload = await unlikeCommentResolver?.(
      {},
      args,
      context
    );

    const testUnlikeCommentPayload = await Comment.findOne({
      _id: testComment._id,
    }).lean();

    expect(unlikeCommentPayload).toEqual(testUnlikeCommentPayload);
  });

  it(`returns the comment with _id === args.id without any mutation if current user
    with _id === context.userId does not exist in likedBy list of the comment`, async () => {
    const args: MutationUnlikeCommentArgs = {
      id: testComment._id,
    };

    const context = {
      userId: testUser!._id,
    };

    const unlikeCommentPayload = await unlikeCommentResolver?.(
      {},
      args,
      context
    );

    const testUnlikeCommentPayload = await Comment.findOne({
      _id: testComment._id,
    }).lean();

    expect(unlikeCommentPayload).toEqual(testUnlikeCommentPayload);
  });
});
