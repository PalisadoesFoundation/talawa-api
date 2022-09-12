import 'dotenv/config';
import { Document, Types } from 'mongoose';
import {
  Interface_User,
  User,
  Organization,
  Interface_Organization,
  Interface_Post,
  Post,
} from '../../../lib/models';
import { MutationCreateCommentArgs } from '../../../generated/graphQLTypescriptTypes';
import { connect, disconnect } from '../../../db';
import { createComment as createCommentResolver } from '../../../lib/resolvers/Mutation/createComment';
import { USER_NOT_FOUND } from '../../../constants';
import { nanoid } from 'nanoid';

let testUser: Interface_User & Document<any, any, Interface_User>;
let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;
let testPost: (Interface_Post & Document<any, any, Interface_Post>) | null;

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
      $push: {
        createdOrganizations: testOrganization._id,
        adminFor: testOrganization._id,
        joinedOrganizations: testOrganization._id,
      },
    }
  );

  testPost = await Post.create({
    text: 'text',
    creator: testUser._id,
    organization: testOrganization._id,
  });
});

afterAll(async () => {
  await disconnect();
});

describe('resolvers -> Mutation -> createComment', () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationCreateCommentArgs = {
        data: {
          text: '',
        },
        postId: '',
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await createCommentResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`creates the comment and returns it`, async () => {
    const args: MutationCreateCommentArgs = {
      data: {
        text: 'text',
      },
      postId: testPost!.id,
    };

    const context = {
      userId: testUser.id,
    };

    const createCommentPayload = await createCommentResolver?.(
      {},
      args,
      context
    );

    expect(createCommentPayload).toEqual(
      expect.objectContaining({
        text: 'text',
        creator: testUser._id,
        post: testPost!._id,
      })
    );

    const testUpdatedPost = await Post.findOne({
      _id: testPost!._id,
    })
      .select(['comments', 'commentCount'])
      .lean();

    expect(testUpdatedPost!.comments).toEqual([createCommentPayload?._id]);
    expect(testUpdatedPost!.commentCount).toEqual(1);
  });
});
