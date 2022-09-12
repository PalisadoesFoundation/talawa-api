import 'dotenv/config';
import { Document, Types } from 'mongoose';
import { Interface_User, User } from '../../../lib/models';
import { MutationRevokeRefreshTokenForUserArgs } from '../../../generated/graphQLTypescriptTypes';
import { connect, disconnect } from '../../../db';
import { revokeRefreshTokenForUser as revokeRefreshTokenForUserResolver } from '../../../lib/resolvers/Mutation/revokeRefreshTokenForUser';
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

describe('resolvers -> Mutation -> revokeRefreshTokenForUser', () => {
  it(`revokes refresh token for the user and returns true`, async () => {
    const args: MutationRevokeRefreshTokenForUserArgs = {
      userId: testUser.id,
    };

    const context = {
      userId: testUser.id,
    };

    const revokeRefreshTokenForUserPayload =
      await revokeRefreshTokenForUserResolver?.({}, args, context);

    expect(revokeRefreshTokenForUserPayload).toEqual(true);

    const testSaveFcmTokenPayload = await User.findOne({
      _id: testUser._id,
    })
      .select('tokenVersion')
      .lean();

    expect(testSaveFcmTokenPayload?.tokenVersion).toEqual(
      testUser.tokenVersion + 1
    );
  });
});
