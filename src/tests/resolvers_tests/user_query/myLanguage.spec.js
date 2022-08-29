const shortid = require('shortid');
const database = require('../../../db');
const { getUserIdFromSignUp } = require('../../helperFunctions');
const myLanguageQuery = require('../../../lib/resolvers/user_query/myLanguage');
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

describe('Testing myLanguage resolver', () => {
  test('Language of the current user', async () => {
    const args = {};

    const response = await myLanguageQuery({}, args, {
      userId: userId,
    });
    expect(response).toBe('en');
  });

  test('User not exist in database', async () => {
    const args = {};

    await expect(async () => {
      await myLanguageQuery({}, args, {
        userId: mongoose.Types.ObjectId(),
      });
    }).rejects.toEqual(Error(USER_NOT_FOUND));
  });
});
