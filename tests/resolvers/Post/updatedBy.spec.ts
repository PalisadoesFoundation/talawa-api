import "dotenv/config";
import { updatedBy as updatedByResolver } from "../../../src/resolvers/Post/updatedBy";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { Comment, User } from "../../../src/models";
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
    createdBy: testUser!._id,
    postId: testPost!._id,
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Post -> updatedBy", () => {
  it(`returns the updatedBy object for parent post`, async () => {
    const parent = testPost!.toObject();

    const updatedByPayload = await updatedByResolver?.(parent, {}, {});

    const updatedByObject = await User.findOne({
      _id: testPost!.createdBy,
    }).lean();

    expect(updatedByPayload).toEqual(updatedByObject);
  });
});
