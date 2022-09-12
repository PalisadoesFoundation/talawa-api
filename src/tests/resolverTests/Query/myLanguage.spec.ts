import 'dotenv/config';
import { myLanguage as myLanguageResolver } from '../../../lib/resolvers/Query/myLanguage';
import { connect, disconnect } from '../../../db';
import { USER_NOT_FOUND } from '../../../constants';
import { User } from '../../../lib/models';
import { nanoid } from 'nanoid';
import { Types } from 'mongoose';

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
});

describe('resolvers -> Query -> myLanguage', () => {
  it('throws NotFoundError if no user exists with _id === context.userId', async () => {
    try {
      const context = {
        userId: Types.ObjectId().toString(),
      };

      await myLanguageResolver?.({}, {}, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`returns current user's appLanguageCode`, async () => {
    const testUser = await User.create({
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: 'password',
      firstName: 'firstName',
      lastName: 'lastName',
      appLanguageCode: 'en',
    });

    const context = {
      userId: testUser?._id,
    };

    const appLanguageCodePayload = await myLanguageResolver?.({}, {}, context);

    expect(appLanguageCodePayload).toEqual(testUser?.appLanguageCode);
  });
});
