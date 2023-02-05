import "dotenv/config";
import { Document, Types } from "mongoose";
import { Post, Comment, Interface_Comment } from "../../../src/models";
import { MutationLikeCommentArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { likeComment as likeCommentResolver } from "../../../src/resolvers/Mutation/likeComment";
import { COMMENT_NOT_FOUND, USER_NOT_FOUND } from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { testUserType } from "../../helpers/userAndOrg";
import { createTestPost } from "../../helpers/posts";

let testUser: testUserType;
let testComment: Interface_Comment & Document<any, any, Interface_Comment>;

beforeAll(async () => {
  await connect();
  const temp = await createTestPost();
  testUser = temp[0];

  const testPost = temp[2];

  testComment = await Comment.create({
    text: "text",
    creator: testUser!._id,
    post: testPost!._id,
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
  await disconnect();
});

describe("resolvers -> Mutation -> likeComment", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationLikeCommentArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await likeCommentResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no comment exists with _id === args.id`, async () => {
    try {
      const args: MutationLikeCommentArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!.id,
      };

      await likeCommentResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(COMMENT_NOT_FOUND);
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
