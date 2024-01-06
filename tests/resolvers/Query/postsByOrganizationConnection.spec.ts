// @ts-nocheck
import "dotenv/config";
import { postsByOrganizationConnection as postsByOrganizationConnectionResolver } from "../../../src/resolvers/Query/postsByOrganizationConnection";
import { connect, disconnect } from "../../helpers/db";
import type { Document } from "mongoose";
import type mongoose from "mongoose";
import { Types } from "mongoose";

import type { QueryPostsByOrganizationConnectionArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type {
  TestUserType,
  TestOrganizationType,
} from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import type { InterfacePost } from "../../../src/models";
import { Post } from "../../../src/models";
import { nanoid } from "nanoid";
import { BASE_URL } from "../../../src/constants";

let MONGOOSE_INSTANCE: typeof mongoose;
let testOrganization: TestOrganizationType;
let testUser: TestUserType;
let testPosts: (InterfacePost & Document<any, any, InterfacePost>)[];

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  const resultArray = await createTestUserAndOrganization();
  testUser = resultArray[0];
  testOrganization = resultArray[1];

  testPosts = await Post.insertMany([
    {
      text: `text${nanoid().toLowerCase()}`,
      title: `title${nanoid()}`,
      imageUrl: `imageUrl${nanoid()}`,
      videoUrl: `videoUrl${nanoid()}`,
      createdBy: testUser?._id,
      organization: testOrganization?._id,
    },
    {
      text: `text${nanoid().toLowerCase()}`,
      title: `title${nanoid()}`,
      imageUrl: `imageUrl${nanoid()}`,
      videoUrl: `videoUrl${nanoid()}`,
      createdBy: testUser?._id,
      organization: testOrganization?._id,
    },
    {
      text: `text${nanoid().toLowerCase()}`,
      title: `title${nanoid()}`,
      imageUrl: `imageUrl${nanoid()}`,
      videoUrl: `videoUrl${nanoid()}`,
      createdBy: testUser?._id,
      organization: testOrganization?._id,
    },
  ]);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> postsByOrganizationConnection", () => {
  it(`when no organization exists with _id === args.id`, async () => {
    const args: QueryPostsByOrganizationConnectionArgs = {
      id: Types.ObjectId().toString(),
      first: 1,
      skip: 1,
      where: null,
      orderBy: null,
    };

    const postsByOrganizationConnectionPayload =
      await postsByOrganizationConnectionResolver?.({}, args, {});

    expect(postsByOrganizationConnectionPayload).toEqual({
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        totalPages: 1,
        nextPageNo: null,
        prevPageNo: null,
        currPageNo: 1,
      },
      edges: [],
      aggregate: { count: 0 },
    });
  });

  it(`returns paginated list of posts filtered by
  args.where === { id_not_in: [testPosts[2]._id], title_not_in: [testPosts[2].title],
  text_not_in: [testPosts[2].text] } and
  sorted by args.orderBy === 'title_DESC'`, async () => {
    const where = {
      _id: {
        $nin: [testPosts[2].id],
      },
      title: {
        $nin: [testPosts[2].title],
      },
      text: {
        $nin: [testPosts[2].text],
      },
    };

    const sort = {
      title: -1,
    };
    const args: QueryPostsByOrganizationConnectionArgs = {
      id: testOrganization?._id,
      first: 2,
      skip: 1,
      where: {
        id_not_in: [testPosts[2].id],
        title_not_in: [testPosts[2].title],
        text_not_in: [testPosts[2].text],
      },
      orderBy: "title_DESC",
    };

    const context = {
      apiRootUrl: BASE_URL,
    };
    const postsByOrganizationConnectionPayload =
      await postsByOrganizationConnectionResolver?.({}, args, context);
    const posts = await Post.find(where).limit(2).skip(1).sort(sort).lean();

    const postsWithId = posts.map((post) => {
      return {
        ...post,
        id: String(post._id),
        imageUrl: post.imageUrl ? `${BASE_URL}${post.imageUrl}` : undefined,
      };
    });

    postsByOrganizationConnectionPayload?.edges.map((post) => {
      return {
        ...post,
        organization: post!.organization._id,
      };
    });
    postsByOrganizationConnectionPayload!.edges = postsWithId;

    expect(postsByOrganizationConnectionPayload).toEqual({
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        totalPages: 1,
        nextPageNo: null,
        prevPageNo: null,
        currPageNo: 1,
      },
      edges: postsWithId,
      aggregate: {
        count: 2,
      },
    });
  });

  it(`throws Error if args.skip === null`, async () => {
    const args: QueryPostsByOrganizationConnectionArgs = {
      id: testOrganization?._id,
      first: 2,
      skip: null,
      where: null,
      orderBy: undefined,
    };

    try {
      await postsByOrganizationConnectionResolver?.({}, args, {});
    } catch (error: any) {
      expect(error).toEqual("parameter.missing");
    }
  });

  it(`throws Error if args.skip === undefined`, async () => {
    const args: QueryPostsByOrganizationConnectionArgs = {
      id: testOrganization?._id,
      first: 2,
      skip: undefined,
      where: null,
      orderBy: undefined,
    };

    try {
      await postsByOrganizationConnectionResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual("Skip parameter is missing");
    }
  });

  it(`returns non-paginated list of posts if args.first === undefined`, async () => {
    const where = {
      createdBy: {
        $in: testUser?._id,
      },
    };

    const args: QueryPostsByOrganizationConnectionArgs = {
      id: testOrganization?._id,
      skip: 1,
      where: {},
      orderBy: null,
    };

    const postsByOrganizationConnectionPayload =
      await postsByOrganizationConnectionResolver?.({}, args, {});

    const postsTestModel = await Post.paginate(where, {
      pagination: false,
      sort: {},
    });

    const postsWithId = postsTestModel.docs.map((post) => {
      return {
        ...post,
        id: String(post._id),
      };
    });
    postsByOrganizationConnectionPayload?.edges.map((post) => {
      return {
        ...post,
        organization: post?.organization._id,
      };
    });
    postsByOrganizationConnectionPayload!.edges = postsWithId;

    expect(postsByOrganizationConnectionPayload).toEqual({
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        totalPages: 1,
        nextPageNo: null,
        prevPageNo: null,
        currPageNo: 1,
      },
      edges: postsWithId,
      aggregate: {
        count: 3,
      },
    });
  });
  it(`returns non-paginated list of posts if args.first === undefined and post.imageUrl === undefined`, async () => {
    await Post.findOneAndUpdate(
      {
        createdBy: testUser?.id,
      },
      {
        $set: {
          imageUrl: undefined,
        },
      }
    );

    const where = {
      createdBy: {
        $in: testUser?._id,
      },
    };

    const args: QueryPostsByOrganizationConnectionArgs = {
      id: testOrganization?._id,
      skip: 1,
      where: {},
      orderBy: null,
    };

    const postsByOrganizationConnectionPayload =
      await postsByOrganizationConnectionResolver?.({}, args, {});

    const postsTestModel = await Post.paginate(where, {
      pagination: false,
      sort: {},
    });

    const postsWithId = postsTestModel.docs.map((post) => {
      return {
        ...post,
        id: String(post._id),
      };
    });
    postsByOrganizationConnectionPayload?.edges.map((post) => {
      return {
        ...post,
        organization: post?.organization._id,
      };
    });
    postsByOrganizationConnectionPayload!.edges = postsWithId;

    expect(postsByOrganizationConnectionPayload).toEqual({
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        totalPages: 1,
        nextPageNo: null,
        prevPageNo: null,
        currPageNo: 1,
      },
      edges: postsWithId,
      aggregate: {
        count: 3,
      },
    });
  });
});
