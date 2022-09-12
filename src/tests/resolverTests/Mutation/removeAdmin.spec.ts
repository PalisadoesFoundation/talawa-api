import 'dotenv/config';
import { Document, Types } from 'mongoose';
import {
  Interface_User,
  User,
  Organization,
  Interface_Organization,
} from '../../../lib/models';
import { MutationRemoveAdminArgs } from '../../../generated/graphQLTypescriptTypes';
import { connect, disconnect } from '../../../db';
import { removeAdmin as removeAdminResolver } from '../../../lib/resolvers/Mutation/removeAdmin';
import {
  ORGANIZATION_NOT_FOUND,
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND,
} from '../../../constants';
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
});

afterAll(async () => {
  await disconnect();
});

describe('resolvers -> Mutation -> removeAdmin', () => {
  it(`throws NotFoundError if no organization exists with _id === args.data.organizationId`, async () => {
    try {
      const args: MutationRemoveAdminArgs = {
        data: {
          organizationId: Types.ObjectId().toString(),
          userId: '',
        },
      };

      const context = {
        userId: testUser.id,
      };

      await removeAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.data.userId`, async () => {
    try {
      const args: MutationRemoveAdminArgs = {
        data: {
          organizationId: testOrganization.id,
          userId: Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: testUser.id,
      };

      await removeAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws UnauthorizedError if user with _id === args.data.userId is not an admin
  of organzation with _id === args.data.organizationId`, async () => {
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

      const args: MutationRemoveAdminArgs = {
        data: {
          organizationId: testOrganization.id,
          userId: testUser.id,
        },
      };

      const context = {
        userId: testUser.id,
      };

      await removeAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is not the creator
  of organization with _id === args.data.organizationId`, async () => {
    try {
      await Organization.updateOne(
        {
          _id: testOrganization._id,
        },
        {
          $push: {
            admins: testUser._id,
          },
          $set: {
            creator: Types.ObjectId().toString(),
          },
        }
      );

      const args: MutationRemoveAdminArgs = {
        data: {
          organizationId: testOrganization.id,
          userId: testUser.id,
        },
      };

      const context = {
        userId: testUser.id,
      };

      await removeAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`removes user with _id === args.data.userId from admins list of the organization
  with _id === args.data.organizationId`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization._id,
      },
      {
        $set: {
          creator: testUser._id,
        },
      }
    );

    const args: MutationRemoveAdminArgs = {
      data: {
        organizationId: testOrganization.id,
        userId: testUser.id,
      },
    };

    const context = {
      userId: testUser.id,
    };

    const removeAdminPayload = await removeAdminResolver?.({}, args, context);

    const updatedTestUser = await User.findOne({
      _id: testUser._id,
    })
      .select(['-password'])
      .lean();

    expect(removeAdminPayload).toEqual(updatedTestUser);
  });
});
