import "dotenv/config";
import { posts as postsResolver } from "../../../src/resolvers/Query/posts";
import { Post } from "../../../src/models";
import { connect, disconnect } from "../../helpers/db";
import { QueryPostsArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import { createSinglePostwithComment } from "../../helpers/posts";
import mongoose from "mongoose";

let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  const [testUser, testOrganization] = await createTestUserAndOrganization();
  await createSinglePostwithComment(testUser?._id, testOrganization?._id);
  await createSinglePostwithComment(testUser?._id, testOrganization?._id);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> posts", () => {
  it(`returns list of all existing posts without sorting if args.orderBy === null`, async () => {
    const sort = {};
    const args: QueryPostsArgs = {
      orderBy: null,
    };

    const postsPayload = await postsResolver?.({}, args, {});

    let posts = await Post.find()
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

    posts = posts.map((post) => {
      post.likeCount = post.likedBy.length ?? 0;
      post.commentCount = post.comments.length ?? 0;

      return post;
    });

    expect(postsPayload).toEqual(posts);
  });

  it(`returns list of all existing posts sorted by ascending order of post._id
  if args.orderBy === 'id_ASC'`, async () => {
    const sort = {
      _id: 1,
    };

    const args: QueryPostsArgs = {
      orderBy: "id_ASC",
    };

    const postsPayload = await postsResolver?.({}, args, {});

    let posts = await Post.find()
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

    posts = posts.map((post) => {
      post.likeCount = post.likedBy.length ?? 0;
      post.commentCount = post.comments.length ?? 0;

      return post;
    });

    expect(postsPayload).toEqual(posts);
  });

  it(`returns list of all existing posts sorted by descending order of post._id
  if args.orderBy === 'id_DESC'`, async () => {
    const sort = {
      _id: -1,
    };

    const args: QueryPostsArgs = {
      orderBy: "id_DESC",
    };

    const postsPayload = await postsResolver?.({}, args, {});

    let posts = await Post.find()
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

    posts = posts.map((post) => {
      post.likeCount = post.likedBy.length ?? 0;
      post.commentCount = post.comments.length ?? 0;

      return post;
    });

    expect(postsPayload).toEqual(posts);
  });

  it(`returns list of all existing posts sorted by ascending order of post.text
  if args.orderBy === 'text_ASC'`, async () => {
    const sort = {
      text: 1,
    };

    const args: QueryPostsArgs = {
      orderBy: "text_ASC",
    };

    const postsPayload = await postsResolver?.({}, args, {});

    let posts = await Post.find()
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

    posts = posts.map((post) => {
      post.likeCount = post.likedBy.length ?? 0;
      post.commentCount = post.comments.length ?? 0;

      return post;
    });

    expect(postsPayload).toEqual(posts);
  });

  it(`returns list of all existing posts sorted by descending order of post.text
  if args.orderBy === 'text_DESC'`, async () => {
    const sort = {
      text: -1,
    };

    const args: QueryPostsArgs = {
      orderBy: "text_DESC",
    };

    const postsPayload = await postsResolver?.({}, args, {});

    let posts = await Post.find()
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

    posts = posts.map((post) => {
      post.likeCount = post.likedBy.length ?? 0;
      post.commentCount = post.comments.length ?? 0;

      return post;
    });

    expect(postsPayload).toEqual(posts);
  });

  it(`returns list of all existing posts sorted by ascending order of post.title
  if args.orderBy === 'title_ASC'`, async () => {
    const sort = {
      title: 1,
    };

    const args: QueryPostsArgs = {
      orderBy: "title_ASC",
    };

    const postsPayload = await postsResolver?.({}, args, {});

    let posts = await Post.find()
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

    posts = posts.map((post) => {
      post.likeCount = post.likedBy.length ?? 0;
      post.commentCount = post.comments.length ?? 0;

      return post;
    });

    expect(postsPayload).toEqual(posts);
  });

  it(`returns list of all existing posts sorted by descending order of post.title
  if args.orderBy === 'title_DESC'`, async () => {
    const sort = {
      title: -1,
    };

    const args: QueryPostsArgs = {
      orderBy: "title_DESC",
    };

    const postsPayload = await postsResolver?.({}, args, {});

    let posts = await Post.find()
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

    posts = posts.map((post) => {
      post.likeCount = post.likedBy.length ?? 0;
      post.commentCount = post.comments.length ?? 0;

      return post;
    });

    expect(postsPayload).toEqual(posts);
  });

  it(`returns list of all existing posts sorted by ascending order of post.createdAt
  if args.orderBy === 'createdAt_ASC'`, async () => {
    const sort = {
      createdAt: 1,
    };

    const args: QueryPostsArgs = {
      orderBy: "createdAt_ASC",
    };

    const postsPayload = await postsResolver?.({}, args, {});

    let posts = await Post.find()
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

    posts = posts.map((post) => {
      post.likeCount = post.likedBy.length ?? 0;
      post.commentCount = post.comments.length ?? 0;

      return post;
    });

    expect(postsPayload).toEqual(posts);
  });

  it(`returns list of all existing posts sorted by descending order of post.createdAt
  if args.orderBy === 'createdAt_DESC'`, async () => {
    const sort = {
      createdAt: -1,
    };

    const args: QueryPostsArgs = {
      orderBy: "createdAt_DESC",
    };

    const postsPayload = await postsResolver?.({}, args, {});

    let posts = await Post.find()
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

    posts = posts.map((post) => {
      post.likeCount = post.likedBy.length ?? 0;
      post.commentCount = post.comments.length ?? 0;

      return post;
    });

    expect(postsPayload).toEqual(posts);
  });

  it(`returns list of all existing posts sorted by ascending order of post.imageUrl
  if args.orderBy === 'imageUrl_ASC'`, async () => {
    const sort = {
      imageUrl: 1,
    };

    const args: QueryPostsArgs = {
      orderBy: "imageUrl_ASC",
    };

    const postsPayload = await postsResolver?.({}, args, {});

    let posts = await Post.find()
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

    posts = posts.map((post) => {
      post.likeCount = post.likedBy.length ?? 0;
      post.commentCount = post.comments.length ?? 0;

      return post;
    });

    expect(postsPayload).toEqual(posts);
  });

  it(`returns list of all existing posts sorted by descending order of post.imageUrl
  if args.orderBy === 'imageUrl_DESC'`, async () => {
    const sort = {
      imageUrl: -1,
    };

    const args: QueryPostsArgs = {
      orderBy: "imageUrl_DESC",
    };

    const postsPayload = await postsResolver?.({}, args, {});

    let posts = await Post.find()
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

    posts = posts.map((post) => {
      post.likeCount = post.likedBy.length ?? 0;
      post.commentCount = post.comments.length ?? 0;

      return post;
    });

    expect(postsPayload).toEqual(posts);
  });

  it(`returns list of all existing posts sorted by ascending order of post.videoUrl
  if args.orderBy === 'videoUrl_ASC'`, async () => {
    const sort = {
      videoUrl: 1,
    };

    const args: QueryPostsArgs = {
      orderBy: "videoUrl_ASC",
    };

    const postsPayload = await postsResolver?.({}, args, {});

    let posts = await Post.find()
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

    posts = posts.map((post) => {
      post.likeCount = post.likedBy.length ?? 0;
      post.commentCount = post.comments.length ?? 0;

      return post;
    });

    expect(postsPayload).toEqual(posts);
  });

  it(`returns list of all existing posts sorted by descending order of post.videoUrl
  if args.orderBy === 'videoUrl_DESC'`, async () => {
    const sort = {
      videoUrl: -1,
    };

    const args: QueryPostsArgs = {
      orderBy: "videoUrl_DESC",
    };

    const postsPayload = await postsResolver?.({}, args, {});

    let posts = await Post.find()
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

    posts = posts.map((post) => {
      post.likeCount = post.likedBy.length ?? 0;
      post.commentCount = post.comments.length ?? 0;

      return post;
    });

    expect(postsPayload).toEqual(posts);
  });

  it(`returns list of all existing posts sorted by ascending order of post.likeCount
  if args.orderBy === 'likeCount_ASC'`, async () => {
    const sort = {
      likeCount: 1,
    };

    const args: QueryPostsArgs = {
      orderBy: "likeCount_ASC",
    };

    const postsPayload = await postsResolver?.({}, args, {});

    let posts = await Post.find()
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

    posts = posts.map((post) => {
      post.likeCount = post.likedBy.length ?? 0;
      post.commentCount = post.comments.length ?? 0;

      return post;
    });

    expect(postsPayload).toEqual(posts);
  });

  it(`returns list of all existing posts sorted by descending order of post.likeCount
  if args.orderBy === 'likeCount_DESC'`, async () => {
    const sort = {
      likeCount: -1,
    };

    const args: QueryPostsArgs = {
      orderBy: "likeCount_DESC",
    };

    const postsPayload = await postsResolver?.({}, args, {});

    let posts = await Post.find()
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

    posts = posts.map((post) => {
      post.likeCount = post.likedBy.length ?? 0;
      post.commentCount = post.comments.length ?? 0;

      return post;
    });

    expect(postsPayload).toEqual(posts);
  });

  it(`returns list of all existing posts sorted by ascending order of post.commentCount
  if args.orderBy === 'commentCount_ASC'`, async () => {
    const sort = {
      commentCount: 1,
    };

    const args: QueryPostsArgs = {
      orderBy: "commentCount_ASC",
    };

    const postsPayload = await postsResolver?.({}, args, {});

    let posts = await Post.find()
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

    posts = posts.map((post) => {
      post.likeCount = post.likedBy.length ?? 0;
      post.commentCount = post.comments.length ?? 0;

      return post;
    });

    expect(postsPayload).toEqual(posts);
  });

  it(`returns list of all existing posts sorted by descending order of post.commentCount
  if args.orderBy === 'commentCount_DESC'`, async () => {
    const sort = {
      commentCount: -1,
    };

    const args: QueryPostsArgs = {
      orderBy: "commentCount_DESC",
    };

    const postsPayload = await postsResolver?.({}, args, {});

    let posts = await Post.find()
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

    posts = posts.map((post) => {
      post.likeCount = post.likedBy.length ?? 0;
      post.commentCount = post.comments.length ?? 0;

      return post;
    });

    expect(postsPayload).toEqual(posts);
  });
});
