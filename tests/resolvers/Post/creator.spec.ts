/* eslint-disable @typescript-eslint/no-non-null-assertion */
import "dotenv/config";
import { creator as creatorResolver } from "../../../src/resolvers/Post/creator";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { Comment, User } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestPostType } from "../../helpers/posts";
import { createTestPost } from "../../helpers/posts";
import type { TestUserType } from "../../helpers/userAndOrg";
import { decryptEmail } from "../../../src/utilities/encryption";

let testPost: TestPostType;
let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , testPost] = await createTestPost();
  await Comment.create({
    text: "test comment",
    creatorId: testUser!._id,
    postId: testPost!._id,
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Post -> creatorId", () => {
  it(`returns the creator object for parent post`, async () => {
    const parent = testPost!.toObject();

    const creatorIdPayload = await creatorResolver?.(parent, {}, {});

    const creatorIdObject = await User.findOne({
      _id: testPost!.creatorId,
    }).lean();

    expect(creatorIdObject).toBeDefined();
    if (!creatorIdObject) {
      throw new Error("creatorIdObject is null or undefined");
    }

    expect(creatorIdObject.email).toBeDefined();
    if (!creatorIdObject.email) {
      throw new Error("creatorIdObject.email is null or undefined");
    }

    try {
      const decrypted = decryptEmail(creatorIdObject.email).decrypted;
      creatorIdObject.email = decrypted;
    } catch (error) {
      console.error(
        `Failed to decrypt email for user ${creatorIdObject._id}:`,
        error,
      );
    }
    expect(creatorIdPayload).toEqual(creatorIdObject);
  });
});
