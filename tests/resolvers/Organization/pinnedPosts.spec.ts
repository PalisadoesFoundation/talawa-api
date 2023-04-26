import "dotenv/config";
import { pinnedPosts as pinnedPostsResolver } from "../../../src/resolvers/Organization/pinnedPosts";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { Post } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { TestOrganizationType } from "../../helpers/userAndOrg";
import { createTestPost } from "../../helpers/posts";

let MONGOOSE_INSTANCE: typeof mongoose;
let testOrganization: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, testOrganization] = await createTestPost(true);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Organization -> pinnedPosts", () => {
  it(`returns all post objects for parent.pinnedPosts`, async () => {
    const parent = testOrganization?.toObject();
    if (parent) {
      const pinnedPostsPayload = await pinnedPostsResolver?.(parent, {}, {});
      const pinnedPosts = await Post.find({
        _id: {
          $in: testOrganization?.pinnedPosts,
        },
      }).lean();

      expect(pinnedPostsPayload).toEqual(pinnedPosts);
    }
  });
});
