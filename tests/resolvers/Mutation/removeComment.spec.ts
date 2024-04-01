import "dotenv/config";
import type mongoose from "mongoose";
import type { Document } from "mongoose";
import { Types } from "mongoose";
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
  COMMENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import type { InterfaceComment } from "../../../src/models";
import { AppUserProfile, Comment, Post, User } from "../../../src/models";
import { removeComment as removeCommentResolver } from "../../../src/resolvers/Mutation/removeComment";
import { cacheComments } from "../../../src/services/CommentCache/cacheComments";
import type { MutationRemoveCommentArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import type { TestPostType } from "../../helpers/posts";
import { createTestPost } from "../../helpers/posts";
import type { TestUserType } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testPost: TestPostType;
let testComment:
  | (InterfaceComment & Document<unknown, unknown, InterfaceComment>)
  | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestPost();
  testUser = temp[0];
  testPost = temp[2];

  testComment = await Comment.create({
    text: "text",
    creatorId: testUser?._id,
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
    },
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
        userId: new Types.ObjectId().toString(),
      };

      const { removeComment: removeCommentResolver } = await import(
        "../../../src/resolvers/Mutation/removeComment"
      );

      await removeCommentResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no comment exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationRemoveCommentArgs = {
        id: new Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?.id,
      };

      const { removeComment: removeCommentResolver } = await import(
        "../../../src/resolvers/Mutation/removeComment"
      );

      await removeCommentResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(COMMENT_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(COMMENT_NOT_FOUND_ERROR.MESSAGE);
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
            creatorId: new Types.ObjectId().toString(),
          },
        },
        {
          new: true,
        },
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
        },
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
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
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
          creatorId: testUser?._id,
        },
      },
      {
        new: true,
      },
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
      },
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
      context,
    );

    const testUpdatedPost = await Post.findOne({
      _id: testPost?._id,
    })
      .select(["commentCount"])
      .lean();

    const commentExists = await Comment.exists({ _id: testComment?._id });

    expect(removeCommentPayload).toEqual({
      ...testComment?.toObject(),
      updatedAt: expect.anything(),
    });
    expect(commentExists).toBeFalsy();
    expect(testUpdatedPost?.commentCount).toEqual(0);
  });
  it("throws an error if the user does not have AppUserProfile", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    await AppUserProfile.deleteOne({
      userId: testUser?._id,
    });
    const args: MutationRemoveCommentArgs = {
      id: testComment?._id.toString() ?? "",
    };
    const context = {
      userId: testUser?._id,
    };
    try {
      const { removeComment: removeCommentResolver } = await import(
        "../../../src/resolvers/Mutation/removeComment"
      );

      await removeCommentResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
});
