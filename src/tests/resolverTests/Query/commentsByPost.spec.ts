import 'dotenv/config';
import { connect, disconnect } from '../../../db';
import { commentsByPost as commentsByPostResolver } from '../../../lib/resolvers/Query/commentsByPost';
import {
  Comment,
  User,
  Post,
  Organization,
  Interface_Post,
  Interface_Organization,
  Interface_User,
} from '../../../lib/models';
import { nanoid } from 'nanoid';
import { Document, Types } from 'mongoose';
import {
  COMMENT_NOT_FOUND,
  ORGANIZATION_NOT_FOUND,
  POST_NOT_FOUND,
  USER_NOT_FOUND,
} from '../../../constants';
import { QueryCommentsByPostArgs } from '../../../generated/graphQLTypescriptTypes';

let testUser: Interface_User & Document<any, any, Interface_User>;
let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;
let testPost: Interface_Post & Document<any, any, Interface_Post>;

beforeAll(async () => {
  await connect();

  testUser = await User.create({
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

  testPost = await Post.create({
    text: 'text',
    creator: testUser._id,
    organization: testOrganization._id,
  });

  const testComment = await Comment.create({
    text: 'text',
    creator: testUser._id,
    post: testPost._id,
  });

  await Post.updateOne(
    {
      _id: testPost._id,
    },
    {
      $push: {
        comments: [testComment._id],
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

describe('resolvers -> Query -> commentsByPost', () => {
  it(`returns list of all comments for post with _id === args.id
  populated with creator, post and likedBy`, async () => {
    const args: QueryCommentsByPostArgs = {
      id: testPost._id,
    };

    const commentsByPostPayload = await commentsByPostResolver?.({}, args, {});

    const commentsByPost = await Comment.find({
      post: testPost._id,
    })
      .populate('creator', '-password')
      .populate('post')
      .populate('likedBy')
      .lean();

    expect(commentsByPostPayload).toEqual(commentsByPost);
  });

  it(`throws NotFoundError if no organization exists with _id === post.organization
  for post with _id === args.id`, async () => {
    try {
      await Organization.deleteOne({
        _id: testOrganization._id,
      });

      const args: QueryCommentsByPostArgs = {
        id: testPost._id,
      };

      await commentsByPostResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no post exists with _id === args.id`, async () => {
    try {
      await Post.deleteOne({
        _id: testPost._id,
      });

      const args: QueryCommentsByPostArgs = {
        id: testPost._id,
      };

      await commentsByPostResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(POST_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no creator exists for first comment for 
   post with id === args.id`, async () => {
    try {
      await User.deleteOne({
        _id: testUser._id,
      });

      const args: QueryCommentsByPostArgs = {
        id: testPost._id,
      };

      await commentsByPostResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no comment exists for post with 
   _id === args.id`, async () => {
    try {
      const args: QueryCommentsByPostArgs = {
        id: Types.ObjectId().toString(),
      };

      await commentsByPostResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(COMMENT_NOT_FOUND);
    }
  });
});
