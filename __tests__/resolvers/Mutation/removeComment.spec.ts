import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
  Interface_Organization,
  Comment,
  Interface_Post,
  Interface_Comment,
  Post,
} from "../../../src/lib/models";
import { MutationRemoveCommentArgs } from "../../../src/generated/graphqlCodegen";
import { connect, disconnect } from "../../../src/db";
import { removeComment as removeCommentResolver } from "../../../src/lib/resolvers/Mutation/removeComment";
import {
  COMMENT_NOT_FOUND,
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND,
} from "../../../src/constants";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUser: Interface_User & Document<any, any, Interface_User>;
let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;
let testPost: (Interface_Post & Document<any, any, Interface_Post>) | null;
let testComment:
  | (Interface_Comment & Document<any, any, Interface_Comment>)
  | null;

beforeAll(async () => {
  await connect();

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });

  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser._id,
    admins: [testUser._id],
    members: [testUser._id],
  });

  await User.updateOne(
    {
      _id: testUser._id,
    },
    {
      $push: {
        createdOrganizations: testOrganization._id,
        adminFor: testOrganization._id,
        joinedOrganizations: testOrganization._id,
      },
    }
  );

  testPost = await Post.create({
    text: "text",
    creator: testUser._id,
    organization: testOrganization._id,
  });

  testComment = await Comment.create({
    text: "text",
    creator: testUser._id,
    post: testPost._id,
  });

  testPost = await Post.findOneAndUpdate(
    {
      _id: testPost._id,
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
        userId: testUser.id,
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
        userId: testUser.id,
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
          creator: testUser._id,
        },
      }
    );

    const args: MutationRemoveCommentArgs = {
      id: testComment!.id,
    };

    const context = {
      userId: testUser.id,
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
