import 'dotenv/config';
import { postsByOrganization as postsByOrganizationResolver } from '../../../lib/resolvers/Query/postsByOrganization';
import {
  User,
  Organization,
  Post,
  Comment,
  Interface_Organization,
} from '../../../lib/models';
import { connect, disconnect } from '../../../db';
import { nanoid } from 'nanoid';
import {
  QueryPostsByOrganizationArgs,
  PostOrderByInput,
} from '../../../generated/graphQLTypescriptTypes';
import { Document } from 'mongoose';

let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;

beforeAll(async () => {
  await connect();

  const testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: 'password',
    firstName: 'firstName',
    lastName: 'lastName',
    appLanguageCode: 'en',
  });

  testOrganization = await Organization.create({
    name: 'name',
    description: 'description',
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
      text: 'text',
      creator: testUser._id,
      post: testPosts[0]._id,
    },
    {
      text: 'text',
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

describe('resolvers -> Query -> posts', () => {
  it(`returns list of all existing posts without sorting if args.orderBy === null`, async () => {
    const sort = {};

    const args: QueryPostsByOrganizationArgs = {
      id: testOrganization.id,
      orderBy: null,
    };

    const postsByOrganizationPayload = await postsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const postsByOrganization = await Post.find({
      organization: testOrganization._id,
    })
      .sort(sort)
      .populate('organization')
      .populate('likedBy')
      .populate({
        path: 'comments',
        populate: {
          path: 'creator',
        },
      })
      .populate('creator', '-password')
      .lean();

    expect(postsByOrganizationPayload).toEqual(postsByOrganization);
  });

  it(`returns list of all existing posts having post.organization with _id === args.id
  sorted by ascending order of post._id if args.orderBy === 'id_ASC'`, async () => {
    const sort = {
      _id: 1,
    };

    const args: QueryPostsByOrganizationArgs = {
      id: testOrganization.id,
      orderBy: PostOrderByInput.IdAsc,
    };

    const postsByOrganizationPayload = await postsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const postsByOrganization = await Post.find({
      organization: testOrganization._id,
    })
      .sort(sort)
      .populate('organization')
      .populate('likedBy')
      .populate({
        path: 'comments',
        populate: {
          path: 'creator',
        },
      })
      .populate('creator', '-password')
      .lean();

    expect(postsByOrganizationPayload).toEqual(postsByOrganization);
  });

  it(`returns list of all existing posts having post.organization with _id === args.id
  sorted by descending order of post._id if args.orderBy === 'id_DESC'`, async () => {
    const sort = {
      _id: -1,
    };

    const args: QueryPostsByOrganizationArgs = {
      id: testOrganization.id,
      orderBy: PostOrderByInput.IdDesc,
    };

    const postsByOrganizationPayload = await postsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const postsByOrganization = await Post.find({
      organization: testOrganization._id,
    })
      .sort(sort)
      .populate('organization')
      .populate('likedBy')
      .populate({
        path: 'comments',
        populate: {
          path: 'creator',
        },
      })
      .populate('creator', '-password')
      .lean();

    expect(postsByOrganizationPayload).toEqual(postsByOrganization);
  });

  it(`returns list of all existing posts having post.organization with _id === args.id
  sorted by ascending order of post.text if args.orderBy === 'text_ASC'`, async () => {
    const sort = {
      text: 1,
    };

    const args: QueryPostsByOrganizationArgs = {
      id: testOrganization.id,
      orderBy: PostOrderByInput.TextAsc,
    };

    const postsByOrganizationPayload = await postsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const postsByOrganization = await Post.find({
      organization: testOrganization._id,
    })
      .sort(sort)
      .populate('organization')
      .populate('likedBy')
      .populate({
        path: 'comments',
        populate: {
          path: 'creator',
        },
      })
      .populate('creator', '-password')
      .lean();

    expect(postsByOrganizationPayload).toEqual(postsByOrganization);
  });

  it(`returns list of all existing posts having post.organization with _id === args.id
  sorted by descending order of post.text if args.orderBy === 'text_DESC'`, async () => {
    const sort = {
      text: -1,
    };

    const args: QueryPostsByOrganizationArgs = {
      id: testOrganization.id,
      orderBy: PostOrderByInput.TextDesc,
    };

    const postsByOrganizationPayload = await postsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const postsByOrganization = await Post.find({
      organization: testOrganization._id,
    })
      .sort(sort)
      .populate('organization')
      .populate('likedBy')
      .populate({
        path: 'comments',
        populate: {
          path: 'creator',
        },
      })
      .populate('creator', '-password')
      .lean();

    expect(postsByOrganizationPayload).toEqual(postsByOrganization);
  });

  it(`returns list of all existing posts having post.organization with _id === args.id
  sorted by ascending order of post.title if args.orderBy === 'title_ASC'`, async () => {
    const sort = {
      title: 1,
    };

    const args: QueryPostsByOrganizationArgs = {
      id: testOrganization.id,
      orderBy: PostOrderByInput.TitleAsc,
    };

    const postsByOrganizationPayload = await postsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const postsByOrganization = await Post.find({
      organization: testOrganization._id,
    })
      .sort(sort)
      .populate('organization')
      .populate('likedBy')
      .populate({
        path: 'comments',
        populate: {
          path: 'creator',
        },
      })
      .populate('creator', '-password')
      .lean();

    expect(postsByOrganizationPayload).toEqual(postsByOrganization);
  });

  it(`returns list of all existing posts having post.organization with _id === args.id
  sorted by descending order of post.title if args.orderBy === 'title_DESC'`, async () => {
    const sort = {
      title: -1,
    };

    const args: QueryPostsByOrganizationArgs = {
      id: testOrganization.id,
      orderBy: PostOrderByInput.TitleDesc,
    };

    const postsByOrganizationPayload = await postsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const postsByOrganization = await Post.find({
      organization: testOrganization._id,
    })
      .sort(sort)
      .populate('organization')
      .populate('likedBy')
      .populate({
        path: 'comments',
        populate: {
          path: 'creator',
        },
      })
      .populate('creator', '-password')
      .lean();

    expect(postsByOrganizationPayload).toEqual(postsByOrganization);
  });

  it(`returns list of all existing posts having post.organization with _id === args.id
  sorted by ascending order of post.createdAt if args.orderBy === 'createdAt_ASC'`, async () => {
    const sort = {
      createdAt: 1,
    };

    const args: QueryPostsByOrganizationArgs = {
      id: testOrganization.id,
      orderBy: PostOrderByInput.CreatedAtAsc,
    };

    const postsByOrganizationPayload = await postsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const postsByOrganization = await Post.find({
      organization: testOrganization._id,
    })
      .sort(sort)
      .populate('organization')
      .populate('likedBy')
      .populate({
        path: 'comments',
        populate: {
          path: 'creator',
        },
      })
      .populate('creator', '-password')
      .lean();

    expect(postsByOrganizationPayload).toEqual(postsByOrganization);
  });

  it(`returns list of all existing posts having post.organization with _id === args.id
  sorted by descending order of post.createdAt if args.orderBy === 'createdAt_DESC'`, async () => {
    const sort = {
      createdAt: -1,
    };

    const args: QueryPostsByOrganizationArgs = {
      id: testOrganization.id,
      orderBy: PostOrderByInput.CreatedAtDesc,
    };

    const postsByOrganizationPayload = await postsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const postsByOrganization = await Post.find({
      organization: testOrganization._id,
    })
      .sort(sort)
      .populate('organization')
      .populate('likedBy')
      .populate({
        path: 'comments',
        populate: {
          path: 'creator',
        },
      })
      .populate('creator', '-password')
      .lean();

    expect(postsByOrganizationPayload).toEqual(postsByOrganization);
  });

  it(`returns list of all existing posts having post.organization with _id === args.id
  sorted by ascending order of post.imageUrl if args.orderBy === 'imageUrl_ASC'`, async () => {
    const sort = {
      imageUrl: 1,
    };

    const args: QueryPostsByOrganizationArgs = {
      id: testOrganization.id,
      orderBy: PostOrderByInput.ImageUrlAsc,
    };

    const postsByOrganizationPayload = await postsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const postsByOrganization = await Post.find({
      organization: testOrganization._id,
    })
      .sort(sort)
      .populate('organization')
      .populate('likedBy')
      .populate({
        path: 'comments',
        populate: {
          path: 'creator',
        },
      })
      .populate('creator', '-password')
      .lean();

    expect(postsByOrganizationPayload).toEqual(postsByOrganization);
  });

  it(`returns list of all existing posts having post.organization with _id === args.id
  sorted by descending order of post.imageUrl if args.orderBy === 'imageUrl_DESC'`, async () => {
    const sort = {
      imageUrl: -1,
    };

    const args: QueryPostsByOrganizationArgs = {
      id: testOrganization.id,
      orderBy: PostOrderByInput.ImageUrlDesc,
    };

    const postsByOrganizationPayload = await postsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const postsByOrganization = await Post.find({
      organization: testOrganization._id,
    })
      .sort(sort)
      .populate('organization')
      .populate('likedBy')
      .populate({
        path: 'comments',
        populate: {
          path: 'creator',
        },
      })
      .populate('creator', '-password')
      .lean();

    expect(postsByOrganizationPayload).toEqual(postsByOrganization);
  });

  it(`returns list of all existing posts having post.organization with _id === args.id
  sorted by ascending order of post.videoUrl if args.orderBy === 'videoUrl_ASC'`, async () => {
    const sort = {
      videoUrl: 1,
    };

    const args: QueryPostsByOrganizationArgs = {
      id: testOrganization.id,
      orderBy: PostOrderByInput.VideoUrlAsc,
    };

    const postsByOrganizationPayload = await postsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const postsByOrganization = await Post.find({
      organization: testOrganization._id,
    })
      .sort(sort)
      .populate('organization')
      .populate('likedBy')
      .populate({
        path: 'comments',
        populate: {
          path: 'creator',
        },
      })
      .populate('creator', '-password')
      .lean();

    expect(postsByOrganizationPayload).toEqual(postsByOrganization);
  });

  it(`returns list of all existing posts having post.organization with _id === args.id
  sorted by descending order of post.videoUrl if args.orderBy === 'videoUrl_DESC'`, async () => {
    const sort = {
      videoUrl: -1,
    };

    const args: QueryPostsByOrganizationArgs = {
      id: testOrganization.id,
      orderBy: PostOrderByInput.VideoUrlDesc,
    };

    const postsByOrganizationPayload = await postsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const postsByOrganization = await Post.find({
      organization: testOrganization._id,
    })
      .sort(sort)
      .populate('organization')
      .populate('likedBy')
      .populate({
        path: 'comments',
        populate: {
          path: 'creator',
        },
      })
      .populate('creator', '-password')
      .lean();

    expect(postsByOrganizationPayload).toEqual(postsByOrganization);
  });

  it(`returns list of all existing posts having post.organization with _id === args.id
  sorted by ascending order of post.likeCount if args.orderBy === 'likeCount_ASC'`, async () => {
    const sort = {
      likeCount: 1,
    };

    const args: QueryPostsByOrganizationArgs = {
      id: testOrganization.id,
      orderBy: PostOrderByInput.LikeCountAsc,
    };

    const postsByOrganizationPayload = await postsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const postsByOrganization = await Post.find({
      organization: testOrganization._id,
    })
      .sort(sort)
      .populate('organization')
      .populate('likedBy')
      .populate({
        path: 'comments',
        populate: {
          path: 'creator',
        },
      })
      .populate('creator', '-password')
      .lean();

    expect(postsByOrganizationPayload).toEqual(postsByOrganization);
  });

  it(`returns list of all existing posts having post.organization with _id === args.id
  sorted by descending order of post.likeCount if args.orderBy === 'likeCount_DESC'`, async () => {
    const sort = {
      likeCount: -1,
    };

    const args: QueryPostsByOrganizationArgs = {
      id: testOrganization.id,
      orderBy: PostOrderByInput.LikeCountDesc,
    };

    const postsByOrganizationPayload = await postsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const postsByOrganization = await Post.find({
      organization: testOrganization._id,
    })
      .sort(sort)
      .populate('organization')
      .populate('likedBy')
      .populate({
        path: 'comments',
        populate: {
          path: 'creator',
        },
      })
      .populate('creator', '-password')
      .lean();

    expect(postsByOrganizationPayload).toEqual(postsByOrganization);
  });

  it(`returns list of all existing posts having post.organization with _id === args.id
  sorted by ascending order of post.commentCount if args.orderBy === 'commentCount_ASC'`, async () => {
    const sort = {
      commentCount: 1,
    };

    const args: QueryPostsByOrganizationArgs = {
      id: testOrganization.id,
      orderBy: PostOrderByInput.CommentCountAsc,
    };

    const postsByOrganizationPayload = await postsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const postsByOrganization = await Post.find({
      organization: testOrganization._id,
    })
      .sort(sort)
      .populate('organization')
      .populate('likedBy')
      .populate({
        path: 'comments',
        populate: {
          path: 'creator',
        },
      })
      .populate('creator', '-password')
      .lean();

    expect(postsByOrganizationPayload).toEqual(postsByOrganization);
  });

  it(`returns list of all existing posts having post.organization with _id === args.id
  sorted by descending order of post.commentCount if args.orderBy === 'commentCount_DESC'`, async () => {
    const sort = {
      commentCount: -1,
    };

    const args: QueryPostsByOrganizationArgs = {
      id: testOrganization.id,
      orderBy: PostOrderByInput.CommentCountDesc,
    };

    const postsByOrganizationPayload = await postsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const postsByOrganization = await Post.find({
      organization: testOrganization._id,
    })
      .sort(sort)
      .populate('organization')
      .populate('likedBy')
      .populate({
        path: 'comments',
        populate: {
          path: 'creator',
        },
      })
      .populate('creator', '-password')
      .lean();

    expect(postsByOrganizationPayload).toEqual(postsByOrganization);
  });

  it(`returns list of all existing posts having post.organization with _id === args.id
  sorted by descending order of post.commentCount if args.orderBy === undefined`, async () => {
    const sort = {
      commentCount: -1,
    };

    const args: QueryPostsByOrganizationArgs = {
      id: testOrganization.id,
      orderBy: undefined,
    };

    const postsByOrganizationPayload = await postsByOrganizationResolver?.(
      {},
      args,
      {}
    );

    const postsByOrganization = await Post.find({
      organization: testOrganization._id,
    })
      .sort(sort)
      .populate('organization')
      .populate('likedBy')
      .populate({
        path: 'comments',
        populate: {
          path: 'creator',
        },
      })
      .populate('creator', '-password')
      .lean();

    expect(postsByOrganizationPayload).toEqual(postsByOrganization);
  });
});
