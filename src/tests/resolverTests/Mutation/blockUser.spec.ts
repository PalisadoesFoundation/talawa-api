import 'dotenv/config';
import { Document, Types } from 'mongoose';
import {
  Interface_User,
  User,
  Organization,
  Interface_Organization,
} from '../../../lib/models';
import { MutationBlockUserArgs } from '../../../generated/graphQLTypescriptTypes';
import { connect, disconnect } from '../../../db';
import { blockUser as blockUserResolver } from '../../../lib/resolvers/Mutation/blockUser';
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
        joinedOrganizations: [testOrganization._id],
      },
    }
  );
});

afterAll(async () => {
  await disconnect();
});

describe('resolvers -> Mutation -> blockUser', () => {
  it(`throws NotFoundError if no organization exists with with _id === args.organizationId`, async () => {
    try {
      const args: MutationBlockUserArgs = {
        organizationId: Types.ObjectId().toString(),
        userId: '',
      };

      const context = {
        userId: testUser.id,
      };

      await blockUserResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.userId`, async () => {
    try {
      const args: MutationBlockUserArgs = {
        organizationId: testOrganization.id,
        userId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser.id,
      };

      await blockUserResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws UnauthorizedError if current user with _id === context.userId is not
  an admin of the organization with _id === args.organizationId`, async () => {
    try {
      const args: MutationBlockUserArgs = {
        organizationId: testOrganization.id,
        userId: testUser.id,
      };

      const context = {
        userId: testUser.id,
      };

      await blockUserResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`throws UnauthorizedError if user with _id === args.userId is already blocked
  from organization with _id === args.organizationId`, async () => {
    try {
      await Organization.updateOne(
        {
          _id: testOrganization._id,
        },
        {
          $push: {
            admins: testUser._id,
            blockedUsers: testUser._id,
          },
        }
      );

      await User.updateOne(
        {
          _id: testUser.id,
        },
        {
          $push: {
            adminFor: testOrganization._id,
          },
        }
      );

      const args: MutationBlockUserArgs = {
        organizationId: testOrganization.id,
        userId: testUser.id,
      };

      const context = {
        userId: testUser.id,
      };

      await blockUserResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`blocks the user with _id === args.userId from the organization with
  _id === args.organizationId and returns the blocked user`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization._id,
      },
      {
        $set: {
          blockedUsers: [],
        },
      }
    );

    const args: MutationBlockUserArgs = {
      organizationId: testOrganization.id,
      userId: testUser.id,
    };

    const context = {
      userId: testUser.id,
    };

    const blockUserPayload = await blockUserResolver?.({}, args, context);

    const testUpdatedTestUser = await User.findOne({
      _id: testUser.id,
    })
      .select(['-password'])
      .lean();

    expect(blockUserPayload).toEqual(testUpdatedTestUser);

    const testUpdatedOrganization = await Organization.findOne({
      _id: testOrganization._id,
    })
      .select(['blockedUsers'])
      .lean();

    expect(testUpdatedOrganization?.blockedUsers).toEqual([testUser._id]);
  });
});
