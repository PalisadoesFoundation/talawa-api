const shortid = require('shortid');

const database = require('../../../db');
const getUserId = require('../../functions/getUserIdFromSignup');
const checkAuth = require('../../../lib/resolvers/auth_query/checkAuth');

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

describe('Testing check auth resolver', () => {
  test('Testing is the user logged in or not', async () => {
    const args = {
      id: '62277875e904753262f99bc3',
    };

    const response = await checkAuth({}, args, {
      userId: userId,
    });

    expect(response).toBeTruthy();
  });
});
