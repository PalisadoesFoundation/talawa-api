import "dotenv/config";
import { posts as postsResolver } from "../../../src/resolvers/Query/posts";
import { User, Organization, Post, Comment } from "../../../src/models";
import { connect, disconnect } from "../../../src/db";
import { nanoid } from "nanoid";
import { QueryPostsArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

beforeAll(async () => {
  await connect("TALAWA_TESTING_DB");

  const testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });

  const testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser._id,
    admins: [testUser._id],
    members: [testUser._id],
  });

  await User.updateOne(
    {
      _id: testUser._id,
    },
    {
      $set: {
        createdOrganizations: [testOrganization._id],
        adminFor: [testOrganization._id],
        joinedOrganizations: [testOrganization._id],
      },
    }
  );

  const testPosts = await Post.insertMany([
    {
      text: `text${nanoid()}`,
      title: `title${nanoid()}`,
      imageUrl: `imageUrl${nanoid()}`,
      videoUrl: `videoUrl${nanoid()}`,
      creator: testUser._id,
      organization: testOrganization._id,
    },
    {
      text: `text${nanoid()}`,
      title: `title${nanoid()}`,
      imageUrl: `imageUrl${nanoid()}`,
      videoUrl: `videoUrl${nanoid()}`,
      creator: testUser._id,
      organization: testOrganization._id,
    },
  ]);

  const testComments = await Comment.insertMany([
    {
      text: "text",
      creator: testUser._id,
      post: testPosts[0]._id,
    },
    {
      text: "text",
      creator: testUser._id,
      post: testPosts[1]._id,
    },
  ]);

  await Post.updateOne(
    {
      _id: testPosts[0]._id,
    },
    {
      $push: {
        likedBy: testUser._id,
        comments: testComments[0]._id,
      },
      $inc: {
        likeCount: 1,
        commentCount: 1,
      },
    }
  );

  await Post.updateOne(
    {
      _id: testPosts[1]._id,
    },
    {
      $push: {
        likedBy: testUser._id,
        comments: testComments[1]._id,
      },
      $inc: {
        likeCount: 1,
        commentCount: 1,
      },
    }
  );
});

afterAll(async () => {
  await disconnect();
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
      post.likeCount = post.likedBy.length || 0;
      post.commentCount = post.comments.length || 0;

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
      post.likeCount = post.likedBy.length || 0;
      post.commentCount = post.comments.length || 0;

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
      post.likeCount = post.likedBy.length || 0;
      post.commentCount = post.comments.length || 0;

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
      post.likeCount = post.likedBy.length || 0;
      post.commentCount = post.comments.length || 0;

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
      post.likeCount = post.likedBy.length || 0;
      post.commentCount = post.comments.length || 0;

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
      post.likeCount = post.likedBy.length || 0;
      post.commentCount = post.comments.length || 0;

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
      post.likeCount = post.likedBy.length || 0;
      post.commentCount = post.comments.length || 0;

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
      post.likeCount = post.likedBy.length || 0;
      post.commentCount = post.comments.length || 0;

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
      post.likeCount = post.likedBy.length || 0;
      post.commentCount = post.comments.length || 0;

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
      post.likeCount = post.likedBy.length || 0;
      post.commentCount = post.comments.length || 0;

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
      post.likeCount = post.likedBy.length || 0;
      post.commentCount = post.comments.length || 0;

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
      post.likeCount = post.likedBy.length || 0;
      post.commentCount = post.comments.length || 0;

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
      post.likeCount = post.likedBy.length || 0;
      post.commentCount = post.comments.length || 0;

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
      post.likeCount = post.likedBy.length || 0;
      post.commentCount = post.comments.length || 0;

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
      post.likeCount = post.likedBy.length || 0;
      post.commentCount = post.comments.length || 0;

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
      post.likeCount = post.likedBy.length || 0;
      post.commentCount = post.comments.length || 0;

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
      post.likeCount = post.likedBy.length || 0;
      post.commentCount = post.comments.length || 0;

      return post;
    });

    expect(postsPayload).toEqual(posts);
  });

  it(`returns list of all existing posts sorted by descending order of post.commentCount
  if args.orderBy === undefined`, async () => {
    const sort = {
      commentCount: -1,
    };

    const args: QueryPostsArgs = {
      orderBy: undefined,
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
      post.likeCount = post.likedBy.length || 0;
      post.commentCount = post.comments.length || 0;

      return post;
    });

    expect(postsPayload).toEqual(posts);
  });
});
