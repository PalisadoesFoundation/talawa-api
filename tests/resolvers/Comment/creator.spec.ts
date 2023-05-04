import "dotenv/config";
import { creator as creatorResolver } from "../../../src/resolvers/Comment/creator";
import { connect, disconnect } from "../../helpers/db";
import type { Document } from "mongoose";
import type mongoose from "mongoose";
import type { InterfaceComment } from "../../../src/models";
import { Comment, User } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestPostType } from "../../helpers/posts";
import { createTestPost } from "../../helpers/posts";
import type { TestUserType } from "../../helpers/userAndOrg";

let testPost: TestPostType;
let testUser: TestUserType;
let testComment:
  | (InterfaceComment & Document<any, any, InterfaceComment>)
  | null;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , testPost] = await createTestPost();
  testComment = await Comment.create({
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
    const parent = testComment!.toObject();

    const creatorPayload = await creatorResolver?.(parent, {}, {});

    const creatorObject = await User.findOne({
      _id: testPost!.creator,
    }).lean();

    expect(creatorPayload).toEqual(creatorObject);
  });
});
