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
  it(`returns list of pinned posts sorted in the decreasing order of createdAt`, async () => {
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
      const t1 = new Date(pinnedPostsPayload?.at(index).createdAt);
      // @ts-ignore
      const t2 = new Date(pinnedPostsPayload?.at(index - 1).createdAt);
      expect(t1.getTime() >= t2.getTime()).toBeTruthy();
    }
  });
});
