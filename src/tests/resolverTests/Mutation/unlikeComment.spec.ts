import 'dotenv/config';
import { Document, Types } from 'mongoose';
import {
  Interface_User,
  User,
  Organization,
  Post,
  Comment,
  Interface_Comment,
} from '../../../lib/models';
import { MutationUnlikeCommentArgs } from '../../../generated/graphQLTypescriptTypes';
import { connect, disconnect } from '../../../db';
import { unlikeComment as unlikeCommentResolver } from '../../../lib/resolvers/Mutation/unlikeComment';
import { COMMENT_NOT_FOUND, USER_NOT_FOUND } from '../../../constants';
import { nanoid } from 'nanoid';

let testUser: Interface_User & Document<any, any, Interface_User>;
let testComment: Interface_Comment & Document<any, any, Interface_Comment>;

beforeAll(async () => {
  await connect();

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: 'password',
    firstName: 'firstName',
    lastName: 'lastName',
    appLanguageCode: 'en',
  });

  const testOrganization = await Organization.create({
    name: 'name',
    description: 'description',
    isPublic: true,
    creator: testUser._id,
    admins: [testUser._id],
    members: [testUser._id],
    visibleInSearch: true,
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

  const testPost = await Post.create({
    text: 'text',
    creator: testUser._id,
    organization: testOrganization._id,
  });

  testComment = await Comment.create({
    text: 'text',
    creator: testUser._id,
    post: testPost._id,
    likedBy: [testUser._id],
    likeCount: 1,
  });

  await Post.updateOne(
    {
      _id: testPost._id,
    },
    {
      $push: {
        comments: testComment._id,
      },
      $inc: {
        commentCount: 1,
      },
    }
  );
});

afterAll(async () => {
  await disconnect();
});

describe('resolvers -> Mutation -> unlikeComment', () => {
  it(`throws NotFoundError if current user with _id === context.userId does not exist`, async () => {
    try {
      const args: MutationUnlikeCommentArgs = {
        id: '',
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await unlikeCommentResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no comment exists with _id === args.id`, async () => {
    try {
      const args: MutationUnlikeCommentArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser._id,
      };

      await unlikeCommentResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(COMMENT_NOT_FOUND);
    }
  });

  it(`removes current user with _id === context.userId from likedBy list
    on comment with _id === args.id`, async () => {
    const args: MutationUnlikeCommentArgs = {
      id: testComment._id,
    };

    const context = {
      userId: testUser._id,
    };

    const unlikeCommentPayload = await unlikeCommentResolver?.(
      {},
      args,
      context
    );

    const testUnlikeCommentPayload = await Comment.findOne({
      _id: testComment._id,
    }).lean();

    expect(unlikeCommentPayload).toEqual(testUnlikeCommentPayload);
  });

  it(`returns the comment with _id === args.id without any mutation if current user
    with _id === context.userId does not exist in likedBy list of the comment`, async () => {
    const args: MutationUnlikeCommentArgs = {
      id: testComment._id,
    };

    const context = {
      userId: testUser._id,
    };

    const unlikeCommentPayload = await unlikeCommentResolver?.(
      {},
      args,
      context
    );

    const testUnlikeCommentPayload = await Comment.findOne({
      _id: testComment._id,
    }).lean();

    expect(unlikeCommentPayload).toEqual(testUnlikeCommentPayload);
  });
});
