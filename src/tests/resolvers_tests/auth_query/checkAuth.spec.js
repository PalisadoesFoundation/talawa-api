const shortid = require('shortid');
const database = require('../../../db');
const { getUserIdFromSignUp } = require('../../helperFunctions');
const checkAuth = require('../../../lib/resolvers/auth_query/checkAuth');

let userId;

beforeAll(async () => {
  require('dotenv').config();
  await database.connect();
  let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  userId = await getUserIdFromSignUp(generatedEmail);
});

afterAll(() => {
  database.disconnect();
});

describe('Testing check auth resolver', () => {
  test('Testing if the user logged in or not', async () => {
    const args = {
      id: '62277875e904753262f99bc3',
    };

    const response = await checkAuth({}, args, {
      userId: userId,
    });

    expect(response).toBeTruthy();
  });
});
