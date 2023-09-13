import "dotenv/config";
import { comments as commentsResolver } from "../../../src/resolvers/Post/comments";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { Comment, Post } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestPostType } from "../../helpers/posts";
import { createTestPost } from "../../helpers/posts";
import type { TestUserType } from "../../helpers/userAndOrg";

let testPost: TestPostType;
let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , testPost] = await createTestPost();
  await Comment.create({
    text: "test comment",
    creator: testUser!._id,
    postId: testPost!._id,
  });

  await Post.findOneAndUpdate(
    {
      _id: testPost?._id,
    },
    {
      $inc: {
        commentCount: 1,
      },
    }
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Post -> comments", () => {
  it(`returns the comment object for parent post`, async () => {
    const parent = await Post.findById(testPost?._id);

    const commentsPayload = await commentsResolver?.(
      parent!.toObject(),
      {},
      {}
    );

    const comments = await Comment.find({
      postId: testPost!._id,
    }).lean();

    expect(commentsPayload).toEqual(comments);
  });
  it(`returns the comment object for parent post from cache`, async () => {
    const parent = await Post.findById(testPost?._id);

    const commentsPayload = await commentsResolver?.(
      parent!.toObject(),
      {},
      {}
    );

    const comments = await Comment.find({
      postId: testPost!._id,
    }).lean();

    expect(commentsPayload).toEqual(comments);
  });
});
