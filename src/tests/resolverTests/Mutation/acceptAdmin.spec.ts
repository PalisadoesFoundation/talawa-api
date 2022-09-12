import 'dotenv/config';
import { Document, Types } from 'mongoose';
import { Interface_User, User } from '../../../lib/models';
import { MutationAcceptAdminArgs } from '../../../generated/graphQLTypescriptTypes';
import { connect, disconnect } from '../../../db';
import { acceptAdmin as acceptAdminResolver } from '../../../lib/resolvers/Mutation/acceptAdmin';
import { USER_NOT_AUTHORIZED, USER_NOT_FOUND } from '../../../constants';
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

describe('resolvers -> Mutation -> acceptAdmin', () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationAcceptAdminArgs = {
        id: testUser.id,
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await acceptAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws Error if user with _id === context.userId is not a SUPERADMIN`, async () => {
    try {
      const args: MutationAcceptAdminArgs = {
        id: testUser.id,
      };

      const context = {
        userId: testUser.id,
      };

      await acceptAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.id`, async () => {
    try {
      await User.updateOne(
        {
          _id: testUser._id,
        },
        {
          $set: {
            userType: 'SUPERADMIN',
          },
        }
      );

      const args: MutationAcceptAdminArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser.id,
      };

      await acceptAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`makes user with _id === args.id adminApproved and returns true`, async () => {
    const args: MutationAcceptAdminArgs = {
      id: testUser.id,
    };

    const context = {
      userId: testUser.id,
    };

    const acceptAdminPayload = await acceptAdminResolver?.({}, args, context);

    expect(acceptAdminPayload).toEqual(true);

    const updatedTestUser = await User.findOne({
      _id: testUser._id,
    })
      .select(['adminApproved'])
      .lean();

    expect(updatedTestUser?.adminApproved).toEqual(true);
  });
});
