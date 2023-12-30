import "dotenv/config";
import type { Document } from "mongoose";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { InterfaceComment } from "../../../src/models";
import { TransactionLog, Comment, Post, User } from "../../../src/models";
import type { MutationRemoveCommentArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import { removeComment as removeCommentResolver } from "../../../src/resolvers/Mutation/removeComment";
import {
  COMMENT_NOT_FOUND_ERROR,
  TRANSACTION_LOG_TYPES,
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
import type { TestUserType } from "../../helpers/userAndOrg";
import type { TestPostType } from "../../helpers/posts";
import { createTestPost } from "../../helpers/posts";
import { cacheComments } from "../../../src/services/CommentCache/cacheComments";
import { wait } from "./acceptAdmin.spec";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testPost: TestPostType;
let testComment:
  | (InterfaceComment & Document<any, any, InterfaceComment>)
  | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestPost();
  testUser = temp[0];
  testPost = temp[2];

  testComment = await Comment.create({
    text: "text",
    creator: testUser?._id,
    postId: testPost?._id,
  });

  testPost = await Post.findOneAndUpdate(
    {
      _id: testPost?._id,
    },
    {
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
        userId: testUser?.id,
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

  it(`throws UnauthorizedError if user with _id === context.userId is not the creator of comment with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      // Remove the user as the creator of the comment
      const updatedComment = await Comment.findOneAndUpdate(
        {
          _id: testComment?._id,
        },
        {
          $set: {
            creator: Types.ObjectId().toString(),
          },
        },
        {
          new: true,
        }
      );

      if (updatedComment !== null) {
        await cacheComments([updatedComment]);
      }

      // Remove the user as the admin of the organization of the post of the comment
      await User.updateOne(
        {
          _id: testUser?._id,
        },
        {
          $pull: {
            adminFor: testPost?.organization,
          },
        }
      );

      const args: MutationRemoveCommentArgs = {
        id: testComment?.id,
      };

      const context = {
        userId: testUser?.id,
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
    // Make the user creator of the comment again
    const updatedComment = await Comment.findOneAndUpdate(
      {
        _id: testComment?._id,
      },
      {
        $set: {
          creator: testUser!._id,
        },
      },
      {
        new: true,
      }
    );

    if (updatedComment !== null) {
      await cacheComments([updatedComment]);
    }

    // Set the user as the admin of the organization of the post of the comment
    await User.updateOne(
      {
        _id: testUser?._id,
      },
      {
        $push: {
          adminFor: testPost?.organization,
        },
      }
    );

    const args: MutationRemoveCommentArgs = {
      id: testComment?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    const removeCommentPayload = await removeCommentResolver?.(
      {},
      args,
      context
    );

    const testUpdatedPost = await Post.findOne({
      _id: testPost?._id,
    })
      .select(["commentCount"])
      .lean();

    const commentExists = await Comment.exists({ _id: testComment?._id });

    expect(removeCommentPayload).toEqual(testComment?.toObject());
    expect(commentExists).toBeFalsy();
    expect(testUpdatedPost?.commentCount).toEqual(0);

    await wait();

    const mostRecentTransactions = await TransactionLog.find()
      .sort({
        createdAt: -1,
      })
      .limit(2);

    expect(mostRecentTransactions[0]).toMatchObject({
      createdBy: testUser?._id,
      type: TRANSACTION_LOG_TYPES.DELETE,
      modelName: "Comment",
    });
    expect(mostRecentTransactions[1]).toMatchObject({
      createdBy: testUser?._id,
      type: TRANSACTION_LOG_TYPES.UPDATE,
      modelName: "Post",
    });
  });
});
