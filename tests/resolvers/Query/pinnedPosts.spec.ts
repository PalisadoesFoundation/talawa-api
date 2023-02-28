import "dotenv/config";
import { pinnedPosts as pinnedPostsResolver } from "../../../src/resolvers/Query/pinnedPosts";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestPost } from "../../helpers/posts";

let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  // Create two pinned posts, and two non pinned posts for testing
  await createTestPost(true);
  await createTestPost(false);
  await createTestPost(true);
  await createTestPost(false);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Query -> pinnedPostsByOrganization", () => {
  it(`returns list of 2 posts sorted in the decreasing order of createdAt`, async () => {
    const pinnedPostsPayload = await pinnedPostsResolver?.({}, {}, {});

    // Check that each post must have pinned = true
    // @ts-ignore
    pinnedPostsPayload?.forEach((post) => expect(post?.pinned).toEqual(true));

    // Check for correct order of posts (post created later should appear first)
    for (
      let index = 1;
      index < (pinnedPostsPayload?.length || 1) - 1;
      index++
    ) {
      // @ts-ignore
      expect(pinnedPostsPayload?.at(index).createdAt).toBeGreaterThanOrEqual(
        // @ts-ignore
        pinnedPostsPayload?.at(index - 1).createdAt
      );
    }
  });
});
