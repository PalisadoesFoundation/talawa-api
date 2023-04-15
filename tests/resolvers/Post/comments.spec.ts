import "dotenv/config";
import { comments as commentsResolver } from "../../../src/resolvers/Post/comments";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { Comment, CommentPost } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestPost,
  TestCommentType,
  TestPostType,
} from "../../helpers/posts";
import { TestUserType } from "../../helpers/userAndOrg";

let testPost: TestPostType;
let testComment: TestCommentType;
let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , testPost] = await createTestPost();
  testComment = await Comment.create({
    text: "test comment",
    creator: testUser!._id,
  });
  await CommentPost.create({
    commentId: testComment!._id,
    postId: testPost!._id,
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Post -> comments", () => {
  it(`returns the comment object for parent post`, async () => {
    const parent = testPost!.toObject();

    const commentsPayload = await commentsResolver?.(parent, {}, {});

    expect(commentsPayload).toEqual([testComment!.toObject()]);
  });
});
