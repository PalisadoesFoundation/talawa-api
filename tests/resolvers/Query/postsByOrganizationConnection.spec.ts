// @ts-nocheck
import "dotenv/config";
import { postsByOrganizationConnection as postsByOrganizationConnectionResolver } from "../../../src/resolvers/Query/postsByOrganizationConnection";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { Document, Types } from "mongoose";
import { QueryPostsByOrganizationConnectionArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  testUserType,
  testOrganizationType,
  createTestUserAndOrganization,
} from "../../helpers/userAndOrg";
import { Post, Interface_Post } from "../../../src/models";
import { nanoid } from "nanoid";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testOrganization: testOrganizationType;
let testUser: testUserType;
let testPosts: (Interface_Post & Document<any, any, Interface_Post>)[];

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
      creator: testUser?._id,
      organization: testOrganization?._id,
    },
    {
      text: `text${nanoid().toLowerCase()}`,
      title: `title${nanoid()}`,
      imageUrl: `imageUrl${nanoid()}`,
      videoUrl: `videoUrl${nanoid()}`,
      creator: testUser?._id,
      organization: testOrganization?._id,
    },
    {
      text: `text${nanoid().toLowerCase()}`,
      title: `title${nanoid()}`,
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
      first: 1,
      skip: 1,
      where: {
        id: testPosts[1]?.id,
        text: testPosts[1]?.text,
        title: testPosts[1]?.title,
      },
      orderBy: "id_ASC",
    };

    const postsByOrganizationConnectionPayload =
      await postsByOrganizationConnectionResolver?.({}, args, {});

    const posts = await Post.find(where).sort(sort).populate("creator").lean();

    const postsWithId = posts.map((post) => {
      return {
        ...post,
        id: String(post._id),
      };
    });

    const serialized_organization =
      postsByOrganizationConnectionPayload?.edges.map((post) => {
        return {
          ...post,
          organization: post?.organization._id,
        };
      });
    postsByOrganizationConnectionPayload!.edges = serialized_organization;

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
        count: 1,
      },
    });
  });

  it(`returns paginated list of posts filtered by
  args.where === { id_not: testPosts[2]._id, title_not: testPosts[2].title,
  text: testPosts[2].text } and
  sorted by args.orderBy === 'id_Desc'`, async () => {
    const where = {
      _id: {
        $ne: testPosts[2]?._id,
      },
      title: {
        $ne: testPosts[2]?.title,
      },
      text: {
        $ne: testPosts[2]?.text,
      },
    };

    const sort = {
      _id: -1,
    };

    const args: QueryPostsByOrganizationConnectionArgs = {
      id: testOrganization?._id,
      first: 2,
      skip: 1,
      where: {
        id_not: testPosts[2]?._id,
        title_not: testPosts[2]?.title,
        text_not: testPosts[2]?.text,
      },
      orderBy: "id_DESC",
    };

    const postsByOrganizationConnectionPayload =
      await postsByOrganizationConnectionResolver?.({}, args, {});

    const posts = await Post.find(where)
      .limit(2)
      .sort(sort)
      .populate("creator")
      .lean();

    const postsWithId = posts.map((post) => {
      return {
        ...post,
        id: String(post._id),
      };
    });

    const serialized_organization =
      postsByOrganizationConnectionPayload?.edges.map((post) => {
        return {
          ...post,
          organization: post!.organization._id,
        };
      });
    postsByOrganizationConnectionPayload!.edges = serialized_organization;

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

  it(`returns paginated list of posts filtered by
  args.where === { id_in: [testPosts[1].id], title_in: [testPosts[1].title],
  text_in: [testPosts[1].text] } and
  sorted by args.orderBy === 'title_ASC'`, async () => {
    const where = {
      _id: {
        $in: [testPosts[1]._id],
      },
      title: {
        $in: [testPosts[1].title],
      },
      text: {
        $in: [testPosts[1].text],
      },
    };

    const sort = {
      title: 1,
    };

    const args: QueryPostsByOrganizationConnectionArgs = {
      id: testOrganization?._id,
      first: 2,
      skip: 1,
      where: {
        id_in: [testPosts[1]._id],
        title_in: [testPosts[1].title],
        text_in: [testPosts[1].text],
      },
      orderBy: "title_ASC",
    };

    const postsByOrganizationConnectionPayload =
      await postsByOrganizationConnectionResolver?.({}, args, {});

    const posts = await Post.find(where)
      .limit(2)
      .sort(sort)
      .populate("creator")
      .lean();
    const postsWithId = posts.map((post) => {
      return {
        ...post,
        id: String(post._id),
      };
    });

    const serialized_organization =
      postsByOrganizationConnectionPayload?.edges.map((post) => {
        return {
          ...post,
          organization: post!.organization._id,
        };
      });

    postsByOrganizationConnectionPayload!.edges = serialized_organization;

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
        count: 1,
      },
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

    const postsByOrganizationConnectionPayload =
      await postsByOrganizationConnectionResolver?.({}, args, {});

    const posts = await Post.find(where)
      .limit(2)
      .skip(1)
      .sort(sort)
      .populate("creator")
      .lean();

    const postsWithId = posts.map((post) => {
      return {
        ...post,
        id: String(post._id),
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

  it(`returns paginated list of posts filtered by
  args.where === { title_contains: testPosts[1].title,
  text_contains: testPosts[1].text } and
  sorted by args.orderBy === 'text_ASC'`, async () => {
    const where = {
      title: {
        $regex: testPosts[1]?.title,
        $options: "i",
      },
      text: {
        $regex: testPosts[1]?.text,
        $options: "i",
      },
    };

    const sort = {
      text: 1,
    };

    const args: QueryPostsByOrganizationConnectionArgs = {
      id: testOrganization?._id,
      first: 2,
      skip: 1,
      where: {
        title_contains: testPosts[1]?.title,
        text_contains: testPosts[1]?.text,
      },
      orderBy: "text_ASC",
    };

    const postsByOrganizationConnectionPayload =
      await postsByOrganizationConnectionResolver?.({}, args, {});

    const posts = await Post.find(where)
      .limit(2)
      .sort(sort)
      .populate("creator")
      .lean();

    const postsWithId = posts.map((post) => {
      return {
        ...post,
        id: String(post._id),
      };
    });

    const serialized_organization =
      postsByOrganizationConnectionPayload?.edges.map((post) => {
        return {
          ...post,
          organization: post!.organization._id,
        };
      });
    postsByOrganizationConnectionPayload!.edges = serialized_organization;

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
        count: 1,
      },
    });
  });

  it(`returns paginated list of posts filtered by
  args.where === { title_starts_with: testPosts[1].title,
  text_starts_with: testPosts[1].text } and
  sorted by args.orderBy === 'text_DESC'`, async () => {
    const where = {
      text: new RegExp("^" + testPosts[1]?.text),
      title: new RegExp("^" + testPosts[1]?.title),
    };

    const sort = {
      text: -1,
    };

    const args: QueryPostsByOrganizationConnectionArgs = {
      id: testOrganization?._id,
      first: 2,
      skip: 1,
      where: {
        text_starts_with: testPosts[1].text,
        title_starts_with: testPosts[1].title,
      },
      orderBy: "text_DESC",
    };

    const postsByOrganizationConnectionPayload =
      await postsByOrganizationConnectionResolver?.({}, args, {});

    const posts = await Post.find(where)
      .limit(2)
      .sort(sort)
      .populate("creator")
      .lean();

    const postsWithId = posts.map((post) => {
      return {
        ...post,
        id: String(post._id),
      };
    });

    const serialized_organization =
      postsByOrganizationConnectionPayload?.edges.map((post) => {
        return {
          ...post,
          organization: post!.organization._id,
        };
      });
    postsByOrganizationConnectionPayload!.edges = serialized_organization;

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
        count: 1,
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
      creator: {
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
