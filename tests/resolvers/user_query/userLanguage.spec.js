const shortid = require('shortid');
const database = require('../../../db');
const getUserId = require('../../functions/getUserIdFromSignup');
const userLanguageQuery = require('../../../lib/resolvers/user_query/userLanguage');

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

describe('Testing userLanguage resolver', () => {
  test('Language of existing user', async () => {
    const args = {
      userId,
    };

    const response = await userLanguageQuery({}, args);
    expect(response).toBe('en');
  });

  test('User not exist in database', async () => {
    const args = {
      userId: '62277875e904753262f99ba9',
    };

    await expect(async () => {
      await userLanguageQuery({}, args);
    }).rejects.toEqual(Error('User not found'));

  });
});