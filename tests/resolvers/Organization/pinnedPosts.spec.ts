import "dotenv/config";
import type mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Organization, Post } from "../../../src/models";
import { pinnedPosts as pinnedPostsResolver } from "../../../src/resolvers/Organization/pinnedPosts";
import { connect, disconnect } from "../../helpers/db";
import type { TestPostType } from "../../helpers/posts";
import { createTestPost } from "../../helpers/posts";
import type { TestOrganizationType } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testOrganization: TestOrganizationType;
let testPost: TestPostType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, testOrganization, testPost] = await createTestPost(true);

  await Organization.findOneAndUpdate(
    {
      _id: testOrganization?.id,
    },
    {
      $push: {
        pinnedPosts: testPost?.id,
      },
    },
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Organization -> pinnedPosts", () => {
  it(`returns all post objects for parent.pinnedPosts`, async () => {
    const testOrganization2 = await Organization.findOne({
      _id: testOrganization?.id,
    });

    const parent = testOrganization2?.toObject();

    if (parent) {
      const pinnedPostsPayload = await pinnedPostsResolver?.(parent, {}, {});
      const pinnedPosts = await Post.find({
        _id: {
          $in: testOrganization2?.pinnedPosts,
        },
      }).lean();

      expect(pinnedPostsPayload).toEqual(pinnedPosts);
    }
  });

  it(`returns all post objects for parent.pinnedPosts from the cache`, async () => {
    const testOrganization2 = await Organization.findOne({
      _id: testOrganization?.id,
    });

    const parent = testOrganization2?.toObject();

    if (parent) {
      const pinnedPostsPayload = await pinnedPostsResolver?.(parent, {}, {});
      const pinnedPosts = await Post.find({
        _id: {
          $in: testOrganization2?.pinnedPosts,
        },
      }).lean();

      expect(pinnedPostsPayload).toEqual(pinnedPosts);
    }
  });
});
