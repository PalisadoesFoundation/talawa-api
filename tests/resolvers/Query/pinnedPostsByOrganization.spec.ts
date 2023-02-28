import "dotenv/config";
import { pinnedPostsByOrganization as pinnedPostsByOrganizationResolver } from "../../../src/resolvers/Query/pinnedPostsByOrganization";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";

import { QueryPinnedPostsByOrganizationArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  testUserType,
  testOrganizationType,
  createTestUserAndOrganization,
} from "../../helpers/userAndOrg";
import { createTestSinglePost, testPostType } from "../../helpers/posts";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testOrganization: testOrganizationType;
let testUser: testUserType;
let testPinnedPost1: testPostType;
let testPinnedPost2: testPostType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, testOrganization] = await createTestUserAndOrganization();

  // Create two pinned posts, and two non pinned posts for testing
  testPinnedPost1 = await createTestSinglePost(
    testUser?._id,
    testOrganization?._id,
    true
  );
  await createTestSinglePost(testUser?._id, testOrganization?._id, false);
  testPinnedPost2 = await createTestSinglePost(
    testUser?._id,
    testOrganization?._id,
    true
  );
  await createTestSinglePost(testUser?._id, testOrganization?._id, false);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Query -> pinnedPostsByOrganization", () => {
  it(`returns list of 2 posts sorted in the decreasing order of createdAt`, async () => {
    const args: QueryPinnedPostsByOrganizationArgs = {
      id: testOrganization?.id,
    };

    const pinnedPostsByOrganizationPayload =
      await pinnedPostsByOrganizationResolver?.({}, args, {});

    // Check for correct length of posts
    expect(pinnedPostsByOrganizationPayload?.length).toEqual(2);

    // Check for correct order of posts (post created later should appear first)

    // @ts-ignore
    expect(pinnedPostsByOrganizationPayload?.at(0)?._id).toEqual(
      testPinnedPost2?._id
    );
    // @ts-ignore
    expect(pinnedPostsByOrganizationPayload?.at(1)?._id).toEqual(
      testPinnedPost1?._id
    );
  });
});
