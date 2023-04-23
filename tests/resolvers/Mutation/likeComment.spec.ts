import "dotenv/config";
import mongoose, { Document, Types } from "mongoose";
import { Post, Comment, InterfaceComment } from "../../../src/models";
import { MutationLikeCommentArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { likeComment as likeCommentResolver } from "../../../src/resolvers/Mutation/likeComment";
import {
  COMMENT_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  afterEach,
  vi,
} from "vitest";
import { TestUserType } from "../../helpers/userAndOrg";
import { createTestPost } from "../../helpers/posts";

let testUser: TestUserType;
let testComment: InterfaceComment & Document<any, any, InterfaceComment>;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestPost();
  testUser = temp[0];

  const testPost = temp[2];

  testComment = await Comment.create({
    text: "text",
    creator: testUser!._id,
    postId: testPost!._id,
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

describe("resolvers -> Mutation -> likeComment", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationLikeCommentArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { likeComment: likeCommentResolver } = await import(
        "../../../src/resolvers/Mutation/likeComment"
      );

      await likeCommentResolver?.({}, args, context);
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
      const args: MutationLikeCommentArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!.id,
      };

      const { likeComment: likeCommentResolver } = await import(
        "../../../src/resolvers/Mutation/likeComment"
      );

      await likeCommentResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(COMMENT_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(COMMENT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`updates likedBy and likeCount fields on comment object with _id === args.id and
  returns it `, async () => {
    const args: MutationLikeCommentArgs = {
      id: testComment.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const likeCommentPayload = await likeCommentResolver?.({}, args, context);

    expect(likeCommentPayload?.likedBy).toEqual([testUser!._id]);
    expect(likeCommentPayload?.likeCount).toEqual(1);
  });

  it(`returns comment object with _id === args.id without liking the comment if user with
  _id === context.userId has already liked it.`, async () => {
    const args: MutationLikeCommentArgs = {
      id: testComment.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const likeCommentPayload = await likeCommentResolver?.({}, args, context);

    expect(likeCommentPayload?.likedBy).toEqual([testUser!._id]);
    expect(likeCommentPayload?.likeCount).toEqual(1);
  });
});
