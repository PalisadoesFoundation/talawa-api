import 'dotenv/config';
import { Document, Types } from 'mongoose';
import { Interface_User, User } from '../../../lib/models';
import { MutationSaveFcmTokenArgs } from '../../../generated/graphQLTypescriptTypes';
import { connect, disconnect } from '../../../db';
import { saveFcmToken as saveFcmTokenResolver } from '../../../lib/resolvers/Mutation/saveFcmToken';
import { USER_NOT_FOUND } from '../../../constants';
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

describe('resolvers -> Mutation -> saveFcmToken', () => {
  it(`throws NotFoundError current user with _id === context.userId does not exist`, async () => {
    try {
      const args: MutationSaveFcmTokenArgs = {
        token: '',
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await saveFcmTokenResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`saves the fcm token and returns true`, async () => {
    const args: MutationSaveFcmTokenArgs = {
      token: 'fcmToken',
    };

    const context = {
      userId: testUser.id,
    };

    const saveFcmTokenPayload = await saveFcmTokenResolver?.({}, args, context);

    expect(saveFcmTokenPayload).toEqual(true);

    const testSaveFcmTokenPayload = await User.findOne({
      _id: testUser._id,
    })
      .select('token')
      .lean();

    expect(testSaveFcmTokenPayload?.token).toEqual('fcmToken');
  });
});
