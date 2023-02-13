import "dotenv/config";
import { comments as commentsResolver } from "../../../src/resolvers/Query/comments";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
import { Comment, Post, User, Organization } from "../../../src/models";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  const testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });

  const testOrganization = await Organization.create({
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
      $set: {
        createdOrganizations: [testOrganization._id],
        adminFor: [testOrganization._id],
        joinedOrganizations: [testOrganization._id],
      },
    }
  );

  const testPost = await Post.create({
    text: "text",
    creator: testUser._id,
    organization: testOrganization._id,
  });

  const testComment = await Comment.create({
    text: "text",
    creator: testUser._id,
    post: testPost._id,
  });

  await Post.updateOne(
    {
      _id: testPost._id,
    },
    {
      $push: {
        comments: [testComment._id],
      },
      $inc: {
        commentCount: 1,
      },
    }
  );

  await Comment.updateOne(
    {
      _id: testComment._id,
    },
    {
      $push: {
        likedBy: testUser._id,
      },
      $inc: {
        likeCount: 1,
      },
    }
  );
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Query -> comments", () => {
  it(`returns list of all existing comments with populated fields:- creator
    , post, likedBy`, async () => {
    const comments = await Comment.find()
      .populate("creator", "-password")
      .populate("post")
      .populate("likedBy")
      .lean();

    const commentsPayload = await commentsResolver?.({}, {}, {});

    expect(commentsPayload).toEqual(comments);
  });
});
