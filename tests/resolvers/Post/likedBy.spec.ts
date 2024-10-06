import "dotenv/config";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestPostType } from "../../helpers/posts";
import { createTestPost } from "../../helpers/posts";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import type { InterfacePost } from "../../../src/models";
import { Organization, Post, User } from "../../../src/models";
import { posts as postResolver } from "../../../src/resolvers/Organization/posts";

let testPost: TestPostType;
let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, testOrganization, testPost] = await createTestPost();

  await User.findByIdAndUpdate(testUser?._id, {
    $set: {
      image: "exampleimageurl.com",
    },
  });

  await Post.updateOne(
    {
      _id: testPost?._id,
    },
    {
      $push: {
        likedBy: testUser?._id,
      },
      $inc: {
        likeCount: 1,
        commentCount: 1,
      },
    },
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> organization -> posts", () => {
  it(`returns the post object for parent post`, async () => {
    const parent = await Organization.findById(testOrganization?._id).lean();

    if (!parent) {
      throw new Error("Parent organization not found.");
    }

    const postPayload = (await postResolver?.(parent, { first: 1 }, {})) as {
      edges: { node: InterfacePost }[];
      totalCount: number;
    };

    expect(postPayload).toBeDefined();
    if (!postPayload) {
      throw new Error("postPayload is null or undefined");
    }
    expect(postPayload.edges).toBeDefined();
    expect(Array.isArray(postPayload.edges)).toBe(true);

    const posts = await Post.find({
      organization: testOrganization?._id,
    }).lean();

    expect(postPayload.edges.length).toEqual(posts.length);
    expect(postPayload.totalCount).toEqual(posts.length);
    const returnedPost = postPayload.edges[0].node;
    expect(returnedPost._id).toEqual(testPost?._id.toString());
    expect(returnedPost.likedBy).toHaveLength(1);
    expect(returnedPost.likedBy[0]._id).toEqual(testUser?._id);
    expect(returnedPost.likedBy[0].image).not.toBeNull();
  });
});
