import "dotenv/config";
import { postsByOrganization as postsByOrganizationResolver } from "../../../src/resolvers/Query/postsByOrganization";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { Post } from "../../../src/models";
import { QueryPostsByOrganizationArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  TestUserType,
  TestOrganizationType,
  createTestUserAndOrganization,
} from "../../helpers/userAndOrg";
import { createSinglePostwithComment } from "../../helpers/posts";
import { BASE_URL } from "../../../src/constants";

let MONGOOSE_INSTANCE: typeof mongoose;
let testOrganization: TestOrganizationType;
let testUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, testOrganization] = await createTestUserAndOrganization();

  await createSinglePostwithComment(testUser?._id, testOrganization?._id);
  await createSinglePostwithComment(testUser?._id, testOrganization?._id);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> posts", () => {
  it(`returns list of all existing posts without sorting if args.orderBy === null`, async () => {
    const sort = {};

    const args: QueryPostsByOrganizationArgs = {
      id: testOrganization?.id,
      orderBy: null,
    };

    const context = {
      apiRootUrl: BASE_URL,
    };

    const postsByOrganizationPayload = await postsByOrganizationResolver?.(
      {},
      args,
      context
    );

    const postsByOrganization = await Post.find({
      organization: testOrganization?._id,
    })
      .sort(sort)
      .populate("organization")
      .populate("likedBy")
      .populate({
        path: "comments",
        populate: {
          path: "creator",
        },
      })
      .populate("creator", "-password")
      .lean();

    const postsWithImageURLResolved = postsByOrganization.map((post) => ({
      ...post,
      imageUrl: post.imageUrl ? `${BASE_URL}${post.imageUrl}` : undefined,
    }));
    expect(postsByOrganizationPayload).toEqual(postsWithImageURLResolved);
  });

  it(`returns list of all existing posts having post.organization with _id === args.id
  sorted by ascending order of post._id if args.orderBy === 'id_ASC'`, async () => {
    const sort = {
      _id: 1,
    };

    const args: QueryPostsByOrganizationArgs = {
      id: testOrganization?.id,
      orderBy: "id_ASC",
    };

    const context = {
      apiRootUrl: BASE_URL,
    };

    const postsByOrganizationPayload = await postsByOrganizationResolver?.(
      {},
      args,
      context
    );

    const postsByOrganization = await Post.find({
      organization: testOrganization?._id,
    })
      .sort(sort)
      .populate("organization")
      .populate("likedBy")
      .populate({
        path: "comments",
        populate: {
          path: "creator",
        },
      })
      .populate("creator", "-password")
      .lean();
    const postsWithImageURLResolved = postsByOrganization.map((post) => ({
      ...post,
      imageUrl: post.imageUrl ? `${BASE_URL}${post.imageUrl}` : undefined,
    }));
    expect(postsByOrganizationPayload).toEqual(postsWithImageURLResolved);
  });

  it(`returns list of all existing posts having post.organization with _id === args.id
  sorted by descending order of post._id if args.orderBy === 'id_DESC'`, async () => {
    const sort = {
      _id: -1,
    };

    const args: QueryPostsByOrganizationArgs = {
      id: testOrganization?.id,
      orderBy: "id_DESC",
    };

    const context = {
      apiRootUrl: BASE_URL,
    };

    const postsByOrganizationPayload = await postsByOrganizationResolver?.(
      {},
      args,
      context
    );

    const postsByOrganization = await Post.find({
      organization: testOrganization?._id,
    })
      .sort(sort)
      .populate("organization")
      .populate("likedBy")
      .populate({
        path: "comments",
        populate: {
          path: "creator",
        },
      })
      .populate("creator", "-password")
      .lean();
    const postsWithImageURLResolved = postsByOrganization.map((post) => ({
      ...post,
      imageUrl: post.imageUrl ? `${BASE_URL}${post.imageUrl}` : undefined,
    }));
    expect(postsByOrganizationPayload).toEqual(postsWithImageURLResolved);
  });

  it(`returns list of all existing posts having post.organization with _id === args.id
  sorted by ascending order of post.title if args.orderBy === 'title_ASC'`, async () => {
    const sort = {
      title: 1,
    };

    const args: QueryPostsByOrganizationArgs = {
      id: testOrganization?.id,
      orderBy: "title_ASC",
    };

    const context = {
      apiRootUrl: BASE_URL,
    };

    const postsByOrganizationPayload = await postsByOrganizationResolver?.(
      {},
      args,
      context
    );
    const postsByOrganization = await Post.find({
      organization: testOrganization?._id,
    })
      .sort(sort)
      .populate("organization")
      .populate("likedBy")
      .populate({
        path: "comments",
        populate: {
          path: "creator",
        },
      })
      .populate("creator", "-password")
      .lean();
    const postsWithImageURLResolved = postsByOrganization.map((post) => ({
      ...post,
      imageUrl: post.imageUrl ? `${BASE_URL}${post.imageUrl}` : undefined,
    }));
    expect(postsByOrganizationPayload).toEqual(postsWithImageURLResolved);
  });

  it(`returns list of all existing posts having post.organization with _id === args.id
  sorted by descending order of post.title if args.orderBy === 'title_DESC'`, async () => {
    const sort = {
      title: -1,
    };

    const args: QueryPostsByOrganizationArgs = {
      id: testOrganization?.id,
      orderBy: "title_DESC",
    };

    const context = {
      apiRootUrl: BASE_URL,
    };

    const postsByOrganizationPayload = await postsByOrganizationResolver?.(
      {},
      args,
      context
    );

    const postsByOrganization = await Post.find({
      organization: testOrganization?._id,
    })
      .sort(sort)
      .populate("organization")
      .populate("likedBy")
      .populate({
        path: "comments",
        populate: {
          path: "creator",
        },
      })
      .populate("creator", "-password")
      .lean();
    const postsWithImageURLResolved = postsByOrganization.map((post) => ({
      ...post,
      imageUrl: post.imageUrl ? `${BASE_URL}${post.imageUrl}` : undefined,
    }));
    expect(postsByOrganizationPayload).toEqual(postsWithImageURLResolved);
  });

  it(`returns list of all existing posts having post.organization with _id === args.id
  sorted by ascending order of post.createdAt if args.orderBy === 'createdAt_ASC'`, async () => {
    const sort = {
      createdAt: 1,
    };

    const args: QueryPostsByOrganizationArgs = {
      id: testOrganization?.id,
      orderBy: "createdAt_ASC",
    };

    const context = {
      apiRootUrl: BASE_URL,
    };

    const postsByOrganizationPayload = await postsByOrganizationResolver?.(
      {},
      args,
      context
    );

    const postsByOrganization = await Post.find({
      organization: testOrganization?._id,
    })
      .sort(sort)
      .populate("organization")
      .populate("likedBy")
      .populate({
        path: "comments",
        populate: {
          path: "creator",
        },
      })
      .populate("creator", "-password")
      .lean();
    const postsWithImageURLResolved = postsByOrganization.map((post) => ({
      ...post,
      imageUrl: post.imageUrl ? `${BASE_URL}${post.imageUrl}` : undefined,
    }));
    expect(postsByOrganizationPayload).toEqual(postsWithImageURLResolved);
  });

  it(`returns list of all existing posts having post.organization with _id === args.id
  sorted by descending order of post.createdAt if args.orderBy === 'createdAt_DESC'`, async () => {
    const sort = {
      createdAt: -1,
    };

    const args: QueryPostsByOrganizationArgs = {
      id: testOrganization?.id,
      orderBy: "createdAt_DESC",
    };

    const context = {
      apiRootUrl: BASE_URL,
    };

    const postsByOrganizationPayload = await postsByOrganizationResolver?.(
      {},
      args,
      context
    );

    const postsByOrganization = await Post.find({
      organization: testOrganization?._id,
    })
      .sort(sort)
      .populate("organization")
      .populate("likedBy")
      .populate({
        path: "comments",
        populate: {
          path: "creator",
        },
      })
      .populate("creator", "-password")
      .lean();
    const postsWithImageURLResolved = postsByOrganization.map((post) => ({
      ...post,
      imageUrl: post.imageUrl ? `${BASE_URL}${post.imageUrl}` : undefined,
    }));
    expect(postsByOrganizationPayload).toEqual(postsWithImageURLResolved);
  });
});
