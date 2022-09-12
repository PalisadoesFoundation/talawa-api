import 'dotenv/config';
import { Document, Types } from 'mongoose';
import {
  Interface_User,
  User,
  Organization,
  Interface_Post,
  Post,
  Interface_Organization,
} from '../../../lib/models';
import { MutationAdminRemovePostArgs } from '../../../generated/graphQLTypescriptTypes';
import { connect, disconnect } from '../../../db';
import { adminRemovePost as adminRemovePostResolver } from '../../../lib/resolvers/Mutation/adminRemovePost';
import {
  ORGANIZATION_NOT_FOUND,
  POST_NOT_FOUND,
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND,
} from '../../../constants';
import { nanoid } from 'nanoid';

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

  await Organization.updateOne(
    {
      _id: testOrganization._id,
    },
    {
      $push: {
        posts: testPost._id,
      },
    }
  );
});

afterAll(async () => {
  await disconnect();
});

describe('resolvers -> Mutation -> adminRemovePost', () => {
  it(`throws NotFoundError if no organization exists with _id === args.organizationId`, async () => {
    try {
      const args: MutationAdminRemovePostArgs = {
        organizationId: Types.ObjectId().toString(),
        postId: '',
      };

      const context = {
        userId: testUser.id,
      };

      await adminRemovePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationAdminRemovePostArgs = {
        organizationId: testOrganization.id,
        postId: testPost.id,
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await adminRemovePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws UnauthorizedError if for user with _id === context.userId is not an
  admin of orgnanization with _id === args.organizationId`, async () => {
    try {
      await Organization.updateOne(
        {
          _id: testOrganization._id,
        },
        {
          $set: {
            admins: [],
          },
        }
      );

      const args: MutationAdminRemovePostArgs = {
        organizationId: testOrganization.id,
        postId: testPost.id,
      };

      const context = {
        userId: testUser.id,
      };

      await adminRemovePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`throws NotFoundError if no post exists with _id === args.postId`, async () => {
    try {
      await Organization.updateOne(
        {
          _id: testOrganization._id,
        },
        {
          $push: {
            admins: testUser._id,
          },
        }
      );

      const args: MutationAdminRemovePostArgs = {
        organizationId: testOrganization.id,
        postId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser.id,
      };

      await adminRemovePostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(POST_NOT_FOUND);
    }
  });

  it(`deletes the post and returns it`, async () => {
    const args: MutationAdminRemovePostArgs = {
      organizationId: testOrganization.id,
      postId: testPost.id,
    };

    const context = {
      userId: testUser.id,
    };

    const adminRemovePostPayload = await adminRemovePostResolver?.(
      {},
      args,
      context
    );

    const updatedTestOrganization = await Organization.findOne({
      _id: testOrganization._id,
    })
      .select(['posts'])
      .lean();

    expect(updatedTestOrganization?.posts).toEqual([]);

    expect(adminRemovePostPayload).toEqual(testPost.toObject());
  });
});
