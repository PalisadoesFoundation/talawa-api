const signup = require('../../../lib/resolvers/auth_mutations/signup');
const refreshToken = require('../../../lib/resolvers/auth_mutations/refresh_token');
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
  test('Refresh Token', async () => {
    const nameForNewUser = shortid.generate().toLowerCase();
    const email = `${nameForNewUser}@test.com`;
    let args = {
      data: {
        firstName: nameForNewUser,
        lastName: nameForNewUser,
        email: email,
        password: 'password',
      },
    };
    const signupResponse = await signup({}, args);
    const token = signupResponse.refreshToken;

    args = {
      refreshToken: token,
    };
    const response = await refreshToken({}, args);
    expect(response).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      })
    );
  });
});
