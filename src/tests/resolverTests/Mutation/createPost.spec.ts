import 'dotenv/config';
import { Document, Types } from 'mongoose';
import {
  Interface_User,
  User,
  Organization,
  Interface_Organization,
} from '../../../lib/models';
import { MutationCreatePostArgs } from '../../../generated/graphQLTypescriptTypes';
import { connect, disconnect } from '../../../db';
import { createPost as createPostResolver } from '../../../lib/resolvers/Mutation/createPost';
import { ORGANIZATION_NOT_FOUND, USER_NOT_FOUND } from '../../../constants';
import { nanoid } from 'nanoid';

let testUser: Interface_User & Document<any, any, Interface_User>;
let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;

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
});

afterAll(async () => {
  await disconnect();
});

describe('resolvers -> Mutation -> createPost', () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationCreatePostArgs = {
        data: {
          organizationId: '',
          text: '',
          videoUrl: '',
          title: '',
        },
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await createPostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no organization exists with _id === args.data.organizationId`, async () => {
    try {
      const args: MutationCreatePostArgs = {
        data: {
          organizationId: Types.ObjectId().toString(),
          text: '',
          videoUrl: '',
          title: '',
        },
      };

      const context = {
        userId: testUser.id,
      };

      await createPostResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND);
    }
  });

  it(`creates the post and returns it`, async () => {
    const args: MutationCreatePostArgs = {
      data: {
        organizationId: testOrganization.id,
        text: 'text',
        videoUrl: 'videoUrl',
        title: 'title',
      },
    };

    const context = {
      userId: testUser.id,
    };

    const createPostPayload = await createPostResolver?.({}, args, context);

    expect(createPostPayload).toEqual(
      expect.objectContaining({
        title: 'title',
        videoUrl: 'videoUrl',
        creator: testUser._id,
        organization: testOrganization._id,
      })
    );
  });
});
