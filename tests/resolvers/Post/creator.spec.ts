import "dotenv/config";
import { creator as creatorResolver } from "../../../src/resolvers/Post/creator";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { Comment, User } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestPost, TestPostType } from "../../helpers/posts";
import { TestUserType } from "../../helpers/userAndOrg";

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
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Post -> creator", () => {
  it(`returns the creator object for parent post`, async () => {
    const parent = testPost!.toObject();

    const creatorPayload = await creatorResolver?.(parent, {}, {});

    const creatorObject = await User.findOne({
      _id: testPost!.creator,
    })
      .select(["-password"])
      .lean();

    expect(creatorPayload).toEqual(creatorObject);
  });
});
