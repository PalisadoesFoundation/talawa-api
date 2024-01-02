import "dotenv/config";
import { postsByUser as postsByUserResolver } from "../../../src/resolvers/Query/postsByUser";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { Post } from "../../../src/models";
import type { QueryPostsByUserArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestUserType } from "../../helpers/user";
import type { TestPostType } from "../../helpers/posts";
import type { TestOrganizationType } from "../../helpers/userAndOrg";

import { createTestUser } from "../../helpers/user";
import { createTestSinglePost } from "../../helpers/posts";
import { BASE_URL } from "../../../src/constants";

let MONGOOSE_INSTANCE: typeof mongoose;
let testPost: TestPostType;
let testUser: TestUserType;
let testOrganization: TestOrganizationType;
beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  testPost = await createTestSinglePost(testUser?._id, testOrganization?._id);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> posts", () => {
  it(`returns list of all existing posts without sorting if args.orderBy === null`, async () => {
    const sort = {};

    const args: QueryPostsByUserArgs = {
      id: testUser?.id,
      orderBy: null,
    };

    const context = {
      apiRootUrl: BASE_URL,
    };

    const postsByUserPayload = await postsByUserResolver?.({}, args, context);

    const postsByUser = await Post.find({
      user: testUser?._id,
    })
      .sort(sort)
      .lean();

    const postsWithImageURLResolved = postsByUser.map((post) => ({
      ...post,
      imageUrl: post.imageUrl ? `${BASE_URL}${post.imageUrl}` : undefined,
      videoUrl: post.videoUrl ? `${BASE_URL}${post.videoUrl}` : undefined,
    }));
    expect(postsByUserPayload).toEqual(postsWithImageURLResolved);
  });
});
