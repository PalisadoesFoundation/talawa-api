const shortid = require('shortid');
const database = require('../../../db');
const getUserId = require('../../functions/getUserIdFromSignup');
const myLanguageQuery = require('../../../lib/resolvers/user_query/myLanguage');
const { USER_NOT_FOUND } = require('../../../constants');

let userId;

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
  let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  userId = await getUserId(generatedEmail);
});

afterAll(() => {
  database.disconnect();
});

describe('Testing myLanguage resolver', () => {
  test('Language of the current user', async () => {
    const args = {
      id: '62277875e904753262f99bc3',
    };

    const response = await myLanguageQuery({}, args, {
      userId: userId,
    });
    expect(response).toBe('en');
  });

  test('User not exist in database', async () => {
    const args = {
      id: '62277875e904753262f99bc3',
    };

    await expect(async () => {
      await myLanguageQuery({}, args, {
        userId: '62277875e904753262f99ba9',
      });
    }).rejects.toEqual(Error(USER_NOT_FOUND));
  });
});
