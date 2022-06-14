const shortid = require('shortid');

const database = require('../../../db');
const getUserId = require('../../functions/getUserIdFromSignup');
const users = require('../../../lib/resolvers/user_query/users');

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

describe('Testing users resolver', () => {
  test('Testing basic info of any user', async () => {
    const args = {
      id: '62277875e904753262f99bc3',
    };

    const response = await users.user({}, args, {
      userId: userId,
    });
    expect(response).toBeTruthy();
  });
});
