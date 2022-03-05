const signup = require('../../../lib/resolvers/auth_mutations/signup');
const revokeRefreshTokenForUser = require('../../../lib/resolvers/auth_mutations/revoke_refresh_token_for_user');
const database = require('../../../db');
const shortid = require('shortid');

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});

describe('Unit testing', () => {
  const nameForNewUser = shortid.generate().toLowerCase();
  const email = `${nameForNewUser}@test.com`;
  let userId;
  test('Revoke Refresh Token', async () => {
    let args = {
      data: {
        firstName: nameForNewUser,
        lastName: nameForNewUser,
        email: email,
        password: 'password',
      },
    };
    const signupResponse = await signup({}, args);
    userId = signupResponse.user._id;
    args = {
      userId: userId,
    };

    const response = await revokeRefreshTokenForUser({}, args);
    expect(response).toEqual(true);
  });
});
