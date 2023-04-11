import "dotenv/config";
import { Document, Types } from "mongoose";
import { Comment, Interface_Comment, Post } from "../../../src/models";
import { MutationRemoveCommentArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { removeComment as removeCommentResolver } from "../../../src/resolvers/Mutation/removeComment";
import {
  COMMENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
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
import { createTestPost, TestPostType } from "../../helpers/posts";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testPost: TestPostType;
let testComment:
  | (Interface_Comment & Document<any, any, Interface_Comment>)
  | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
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
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> removeComment", () => {
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
      const args: MutationRemoveCommentArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { removeComment: removeCommentResolver } = await import(
        "../../../src/resolvers/Mutation/removeComment"
      );

      await removeCommentResolver?.({}, args, context);
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
      const args: MutationRemoveCommentArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!.id,
      };

      const { removeComment: removeCommentResolver } = await import(
        "../../../src/resolvers/Mutation/removeComment"
      );

      await removeCommentResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(COMMENT_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(COMMENT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is not the creator
  of comment with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
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

      const { removeComment: removeCommentResolver } = await import(
        "../../../src/resolvers/Mutation/removeComment"
      );

      await removeCommentResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
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
