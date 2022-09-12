import 'dotenv/config';
import { connect, disconnect } from '../../../db';
import { checkAuth as checkAuthResolver } from '../../../lib/resolvers/Query/checkAuth';
import { Types } from 'mongoose';
import { User } from '../../../lib/models';
import { USER_NOT_FOUND } from '../../../constants';
import { nanoid } from 'nanoid';

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
});

describe('resolvers -> Query -> checkAuth', () => {
  it('throws NotFoundError if no user exists with _id === context.userId', async () => {
    try {
      const context = {
        userId: Types.ObjectId().toString(),
      };

      await checkAuthResolver?.({}, {}, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it('returns user object', async () => {
    const testUser = await User.create({
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: 'password',
      firstName: 'firstName',
      lastName: 'lastName',
      appLanguageCode: 'en',
    });

    const context = {
      userId: testUser._id,
    };

    const user = await checkAuthResolver?.({}, {}, context);

    expect(user).toEqual(testUser.toObject());
  });
});
