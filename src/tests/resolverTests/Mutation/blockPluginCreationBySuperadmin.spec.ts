import 'dotenv/config';
import { Document, Types } from 'mongoose';
import {
  Interface_User,
  User,
  Organization,
  Interface_Organization,
} from '../../../lib/models';
import { MutationBlockPluginCreationBySuperadminArgs } from '../../../generated/graphQLTypescriptTypes';
import { connect, disconnect } from '../../../db';
import { blockPluginCreationBySuperadmin as blockPluginCreationBySuperadminResolver } from '../../../lib/resolvers/Mutation/blockPluginCreationBySuperadmin';
import {
  ORGANIZATION_NOT_FOUND,
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND,
} from '../../../constants';
import { nanoid } from 'nanoid';

let testUser: Interface_User & Document<any, any, Interface_User>;

beforeAll(async () => {
  await connect();

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: 'password',
    firstName: 'firstName',
    lastName: 'lastName',
    appLanguageCode: 'en',
  });
});

afterAll(async () => {
  await disconnect();
});

describe('resolvers -> Mutation -> blockPluginCreationBySuperadmin', () => {
  it(`throws NotFoundError if no user exists with with _id === args.userId`, async () => {
    try {
      const args: MutationBlockPluginCreationBySuperadminArgs = {
        blockUser: false,
        userId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser.id,
      };

      await blockPluginCreationBySuperadminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationBlockPluginCreationBySuperadminArgs = {
        blockUser: false,
        userId: testUser.id,
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await blockPluginCreationBySuperadminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws UnauthorizedError if current user with _id === context.userId is not
  a SUPERADMIN`, async () => {
    try {
      const args: MutationBlockPluginCreationBySuperadminArgs = {
        blockUser: false,
        userId: testUser.id,
      };

      const context = {
        userId: testUser.id,
      };

      await blockPluginCreationBySuperadminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`depending on args.blockUser blocks/unblocks plugin creation for user
  with _id === args.userId and returns the user`, async () => {
    await User.updateOne(
      {
        _id: testUser._id,
      },
      {
        userType: 'SUPERADMIN',
      }
    );

    const args: MutationBlockPluginCreationBySuperadminArgs = {
      blockUser: true,
      userId: testUser.id,
    };

    const context = {
      userId: testUser.id,
    };

    const blockPluginCreationBySuperadminPayload =
      await blockPluginCreationBySuperadminResolver?.({}, args, context);

    const testUpdatedTestUser = await User.findOne({
      _id: testUser.id,
    }).lean();

    expect(blockPluginCreationBySuperadminPayload).toEqual(testUpdatedTestUser);
  });
});
