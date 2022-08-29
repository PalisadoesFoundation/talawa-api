const shortid = require('shortid');
const database = require('../../../db');
const { getUserIdFromSignUp } = require('../../helperFunctions');
const userLanguageQuery = require('../../../lib/resolvers/user_query/userLanguage');
const mongoose = require('mongoose');
const { USER_NOT_FOUND } = require('../../../constants');

let userId;

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
  let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  userId = await getUserIdFromSignUp(generatedEmail);
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
      userId: mongoose.Types.ObjectId(),
    };

    await expect(async () => {
      await userLanguageQuery({}, args);
    }).rejects.toEqual(Error(USER_NOT_FOUND));
  });
});
