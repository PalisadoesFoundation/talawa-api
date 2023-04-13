// @ts-nocheck
import "dotenv/config";
import { postsByOrganizationConnection as postsByOrganizationConnectionResolver } from "../../../src/resolvers/Query/postsByOrganizationConnection";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { Document, Types } from "mongoose";
import { QueryPostsByOrganizationConnectionArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  TestUserType,
  TestOrganizationType,
  createTestUserAndOrganization,
} from "../../helpers/userAndOrg";
import { Post, Interface_Post } from "../../../src/models";
import { nanoid } from "nanoid";
import { BASE_URL } from "../../../src/constants";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testOrganization: TestOrganizationType;
let testUser: TestUserType;
let testPosts: (Interface_Post & Document<any, any, Interface_Post>)[];

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  const resultArray = await createTestUserAndOrganization();
  testUser = resultArray[0];
  testOrganization = resultArray[1];

  testPosts = await Post.insertMany([
    {
      text: `text${nanoid().toLowerCase()}`,
      title: `titlea`,
      imageUrl: `imageUrl${nanoid()}`,
      videoUrl: `videoUrl${nanoid()}`,
      creator: testUser?._id,
      organization: testOrganization?._id,
    },
    {
      text: `text${nanoid().toLowerCase()}`,
      title: `titleb`,
      imageUrl: `imageUrl${nanoid()}`,
      videoUrl: `videoUrl${nanoid()}`,
      creator: testUser?._id,
      organization: testOrganization?._id,
    },
    {
      text: `text${nanoid().toLowerCase()}`,
      title: `titlec`,
      imageUrl: `imageUrl${nanoid()}`,
      videoUrl: `videoUrl${nanoid()}`,
      creator: testUser?._id,
      organization: testOrganization?._id,
    },
  ]);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Query -> postsByOrganizationConnection", () => {
  it(`when no organization exists with _id === args.id`, async () => {
    const args: QueryPostsByOrganizationConnectionArgs = {
      id: Types.ObjectId().toString(),
      where: null,
      orderBy: null,
    };

    const postsByOrganizationConnectionPayload =
      await postsByOrganizationConnectionResolver?.({}, args, {});

    expect(postsByOrganizationConnectionPayload).toEqual({
      edges: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
    });
  });

  it(`returns paginated list of posts filtered by
    args.where === { id: testPosts[1].id, text: testPosts[1].text,
    title: testPost[1].title } and sorted by
    args.orderBy === 'id_ASC'`, async () => {
    const where = {
      _id: testPosts[1]?.id,
      text: testPosts[1]?.text,
      title: testPosts[1]?.title,
    };

    const sort = {
      _id: 1,
    };

    const args: QueryPostsByOrganizationConnectionArgs = {
      id: testOrganization?._id,
      where: {
        id: testPosts[1]?.id,
        text: testPosts[1]?.text,
        title: testPosts[1]?.title,
      },
      orderBy: "id_ASC",
    };

    const context = {
      apiRootUrl: BASE_URL,
    };
    const postsByOrganizationConnectionPayload =
      await postsByOrganizationConnectionResolver?.({}, args, context);

    const posts = await Post.find(where).sort(sort).populate("creator").lean();

    const edges = posts.map((post, _index) => {
      return {
        node: post,
        cursor: String(post._id),
      };
    });

    expect(postsByOrganizationConnectionPayload).toEqual({
      edges: edges,
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: String(posts[0]._id),
        endCursor: String(posts[0]._id),
      },
    });
  });

  it(`returns paginated list of posts sorted by
  args.orderBy === 'createdAt_ASC' and after testPosts[0]`, async () => {
    const where = {
      _id: { $ne: String(testPosts[0]._id) },
      organization: testOrganization?._id,
    };

    const sort = {
      createdAt: 1,
      _id: 1,
    };

    const testCursor =
      String(testPosts[0]._id) + "_" + testPosts[0].createdAt.toISOString();

    const args: QueryPostsByOrganizationConnectionArgs = {
      id: testOrganization?._id,
      after: testCursor,
      orderBy: "createdAt_ASC",
    };

    const context = {
      apiRootUrl: BASE_URL,
    };

    const postsByOrganizationConnectionPayload =
      await postsByOrganizationConnectionResolver?.({}, args, context);

    const posts = await Post.find(where).sort(sort).populate("creator").lean();

    const edges = posts.map((post, _index) => {
      const cursor = String(post._id) + "_" + post.createdAt.toISOString();

      return {
        node: post,
        cursor,
      };
    });

    expect(postsByOrganizationConnectionPayload).toEqual({
      edges,
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: true,
        startCursor:
          String(posts[0]._id) + "_" + posts[0].createdAt.toISOString(),
        endCursor:
          String(posts[1]._id) + "_" + posts[1].createdAt.toISOString(),
      },
    });
  });

  it(`returns paginated list of posts sorted by
  args.orderBy === 'createdAt_DESC' and after testPosts[2]`, async () => {
    const where = {
      _id: { $ne: String(testPosts[2]._id) },
      organization: testOrganization?._id,
    };

    const sort = {
      createdAt: -1,
      _id: -1,
    };

    const testCursor =
      String(testPosts[2]._id) + "_" + testPosts[2].createdAt.toISOString();

    const args: QueryPostsByOrganizationConnectionArgs = {
      id: testOrganization?._id,
      after: testCursor,
      orderBy: "createdAt_DESC",
    };

    const context = {
      apiRootUrl: BASE_URL,
    };

    const postsByOrganizationConnectionPayload =
      await postsByOrganizationConnectionResolver?.({}, args, context);

    const posts = await Post.find(where).sort(sort).populate("creator").lean();

    const edges = posts.map((post, _index) => {
      const cursor = String(post._id) + "_" + post.createdAt.toISOString();

      return {
        node: post,
        cursor,
      };
    });

    expect(postsByOrganizationConnectionPayload).toEqual({
      edges,
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: true,
        startCursor:
          String(posts[0]._id) + "_" + posts[0].createdAt.toISOString(),
        endCursor:
          String(posts[1]._id) + "_" + posts[1].createdAt.toISOString(),
      },
    });
  });

  it(`returns paginated list of posts sorted by
  args.orderBy === 'createdAt_ASC' and before testPosts[2]`, async () => {
    const where = {
      _id: { $ne: String(testPosts[2]._id) },
      organization: testOrganization?._id,
    };

    const sort = {
      createdAt: 1,
      _id: 1,
    };

    const testCursor =
      String(testPosts[2]._id) + "_" + testPosts[2].createdAt.toISOString();

    const args: QueryPostsByOrganizationConnectionArgs = {
      id: testOrganization?._id,
      before: testCursor,
      orderBy: "createdAt_ASC",
    };

    const context = {
      apiRootUrl: BASE_URL,
    };

    const postsByOrganizationConnectionPayload =
      await postsByOrganizationConnectionResolver?.({}, args, context);

    const posts = await Post.find(where).sort(sort).populate("creator").lean();

    const edges = posts.map((post, _index) => {
      const cursor = String(post._id) + "_" + post.createdAt.toISOString();

      return {
        node: post,
        cursor,
      };
    });

    expect(postsByOrganizationConnectionPayload).toEqual({
      edges,
      pageInfo: {
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor:
          String(posts[0]._id) + "_" + posts[0].createdAt.toISOString(),
        endCursor:
          String(posts[1]._id) + "_" + posts[1].createdAt.toISOString(),
      },
    });
  });

  it(`returns paginated list of posts sorted by
  args.orderBy === 'createdAt_DESC' and before testPosts[0]`, async () => {
    const where = {
      _id: { $ne: String(testPosts[0]._id) },
      organization: testOrganization?._id,
    };

    const sort = {
      createdAt: -1,
      _id: -1,
    };

    const testCursor =
      String(testPosts[0]._id) + "_" + testPosts[0].createdAt.toISOString();

    const args: QueryPostsByOrganizationConnectionArgs = {
      id: testOrganization?._id,
      before: testCursor,
      orderBy: "createdAt_DESC",
    };

    const context = {
      apiRootUrl: BASE_URL,
    };

    const postsByOrganizationConnectionPayload =
      await postsByOrganizationConnectionResolver?.({}, args, context);

    const posts = await Post.find(where).sort(sort).populate("creator").lean();

    const edges = posts.map((post, _index) => {
      const cursor = String(post._id) + "_" + post.createdAt.toISOString();

      return {
        node: post,
        cursor,
      };
    });

    expect(postsByOrganizationConnectionPayload).toEqual({
      edges,
      pageInfo: {
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor:
          String(posts[0]._id) + "_" + posts[0].createdAt.toISOString(),
        endCursor:
          String(posts[1]._id) + "_" + posts[1].createdAt.toISOString(),
      },
    });
  });

  it(`returns paginated list of posts sorted by
  args.orderBy === 'title_DESC' and before testPosts[0]`, async () => {
    const where = {
      _id: { $ne: String(testPosts[0]._id) },
      organization: testOrganization?._id,
    };

    const sort = {
      title: -1,
      _id: -1,
    };

    const testCursor = String(testPosts[0]._id) + "_" + testPosts[0].title;

    const args: QueryPostsByOrganizationConnectionArgs = {
      id: testOrganization?._id,
      before: testCursor,
      orderBy: "title_DESC",
    };

    const context = {
      apiRootUrl: BASE_URL,
    };

    const postsByOrganizationConnectionPayload =
      await postsByOrganizationConnectionResolver?.({}, args, context);

    const posts = await Post.find(where).sort(sort).populate("creator").lean();

    const edges = posts.map((post, _index) => {
      const cursor = String(post._id) + "_" + post.title;

      return {
        node: post,
        cursor,
      };
    });

    expect(postsByOrganizationConnectionPayload).toEqual({
      edges,
      pageInfo: {
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: String(posts[0]._id) + "_" + posts[0].title,
        endCursor: String(posts[1]._id) + "_" + posts[1].title,
      },
    });
  });

  it(`returns paginated list of posts sorted by
  args.orderBy === 'id_DESC' and before testPosts[0]`, async () => {
    const where = {
      _id: { $ne: String(testPosts[0]._id) },
      organization: testOrganization?._id,
    };

    const sort = {
      _id: -1,
    };

    const testCursor = String(testPosts[0]._id);

    const args: QueryPostsByOrganizationConnectionArgs = {
      id: testOrganization?._id,
      before: testCursor,
      orderBy: "id_DESC",
    };

    const context = {
      apiRootUrl: BASE_URL,
    };

    const postsByOrganizationConnectionPayload =
      await postsByOrganizationConnectionResolver?.({}, args, context);

    const posts = await Post.find(where).sort(sort).populate("creator").lean();

    const edges = posts.map((post, _index) => {
      const cursor = String(post._id);

      return {
        node: post,
        cursor,
      };
    });

    expect(postsByOrganizationConnectionPayload).toEqual({
      edges,
      pageInfo: {
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: String(posts[0]._id),
        endCursor: String(posts[1]._id),
      },
    });
  });

  it(`returns paginated list of posts sorted by
  args.orderBy === 'id_ASC' and before testPosts[2]`, async () => {
    const where = {
      _id: { $ne: String(testPosts[2]._id) },
      organization: testOrganization?._id,
    };

    const sort = {
      _id: 1,
    };

    const testCursor = String(testPosts[2]._id);

    const args: QueryPostsByOrganizationConnectionArgs = {
      id: testOrganization?._id,
      before: testCursor,
      orderBy: "id_ASC",
    };

    const context = {
      apiRootUrl: BASE_URL,
    };

    const postsByOrganizationConnectionPayload =
      await postsByOrganizationConnectionResolver?.({}, args, context);

    const posts = await Post.find(where).sort(sort).populate("creator").lean();

    const edges = posts.map((post, _index) => {
      const cursor = String(post._id);

      return {
        node: post,
        cursor,
      };
    });

    expect(postsByOrganizationConnectionPayload).toEqual({
      edges,
      pageInfo: {
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: String(posts[0]._id),
        endCursor: String(posts[1]._id),
      },
    });
  });

  it(`returns paginated list of posts sorted by
  args.orderBy === 'id_ASC' and after testPosts[0]`, async () => {
    const where = {
      _id: { $ne: String(testPosts[0]._id) },
      organization: testOrganization?._id,
    };

    const sort = {
      _id: 1,
    };

    const testCursor = String(testPosts[0]._id);

    const args: QueryPostsByOrganizationConnectionArgs = {
      id: testOrganization?._id,
      after: testCursor,
      orderBy: "id_ASC",
    };

    const context = {
      apiRootUrl: BASE_URL,
    };

    const postsByOrganizationConnectionPayload =
      await postsByOrganizationConnectionResolver?.({}, args, context);

    const posts = await Post.find(where).sort(sort).populate("creator").lean();

    const edges = posts.map((post, _index) => {
      const cursor = String(post._id);

      return {
        node: post,
        cursor,
      };
    });

    expect(postsByOrganizationConnectionPayload).toEqual({
      edges,
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: true,
        startCursor: String(posts[0]._id),
        endCursor: String(posts[1]._id),
      },
    });
  });

  it(`returns paginated list of posts sorted by
  args.orderBy === 'id_DESC' and after testPosts[2]`, async () => {
    const where = {
      _id: { $ne: String(testPosts[2]._id) },
      organization: testOrganization?._id,
    };

    const sort = {
      _id: -1,
    };

    const testCursor = String(testPosts[2]._id);

    const args: QueryPostsByOrganizationConnectionArgs = {
      id: testOrganization?._id,
      after: testCursor,
      orderBy: "id_DESC",
    };

    const context = {
      apiRootUrl: BASE_URL,
    };

    const postsByOrganizationConnectionPayload =
      await postsByOrganizationConnectionResolver?.({}, args, context);

    const posts = await Post.find(where).sort(sort).populate("creator").lean();

    const edges = posts.map((post, _index) => {
      const cursor = String(post._id);

      return {
        node: post,
        cursor,
      };
    });

    expect(postsByOrganizationConnectionPayload).toEqual({
      edges,
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: true,
        startCursor: String(posts[0]._id),
        endCursor: String(posts[1]._id),
      },
    });
  });
});
