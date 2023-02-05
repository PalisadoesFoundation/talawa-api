import "dotenv/config";
import { Document, Types } from "mongoose";
import { Comment, Interface_Comment, Post } from "../../../src/models";
import { MutationRemoveCommentArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { removeComment as removeCommentResolver } from "../../../src/resolvers/Mutation/removeComment";
import {
  COMMENT_NOT_FOUND,
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { testUserType } from "../../helpers/userAndOrg";
import { createTestPost, testPostType } from "../../helpers/posts";

let testUser: testUserType;
let testPost: testPostType;
let testComment:
  | (Interface_Comment & Document<any, any, Interface_Comment>)
  | null;

beforeAll(async () => {
  await connect("TALAWA_TESTING_DB");
  const temp = await createTestPost();
  testUser = temp[0];
  testPost = temp[2];
  testComment = await Comment.create({
    text: "text",
    creator: testUser!._id,
    post: testPost!._id,
  });

  testPost = await Post.findOneAndUpdate(
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
    },
    {
      new: true,
    }
  );
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> removeComment", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationRemoveCommentArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await removeCommentResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no comment exists with _id === args.id`, async () => {
    try {
      const args: MutationRemoveCommentArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!.id,
      };

      await removeCommentResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(COMMENT_NOT_FOUND);
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is not the creator
  of comment with _id === args.id`, async () => {
    try {
      await Comment.updateOne(
        {
          _id: testComment!._id,
        },
        {
          $set: {
            creator: Types.ObjectId().toString(),
          },
        }
      );

      const args: MutationRemoveCommentArgs = {
        id: testComment!.id,
      };

      const context = {
        userId: testUser!.id,
      };

      await removeCommentResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`deletes the comment with _id === args.id`, async () => {
    await Comment.updateOne(
      {
        _id: testComment!._id,
      },
      {
        $set: {
          creator: testUser!._id,
        },
      }
    );

    const args: MutationRemoveCommentArgs = {
      id: testComment!.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const removeCommentPayload = await removeCommentResolver?.(
      {},
      args,
      context
    );

    expect(removeCommentPayload).toEqual(testComment!.toObject());

    const testUpdatedPost = await Post.findOne({
      _id: testPost!._id,
    })
      .select(["comments", "commentCount"])
      .lean();

    expect(testUpdatedPost!.comments).toEqual([]);
    expect(testUpdatedPost!.commentCount).toEqual(0);
  });
});
