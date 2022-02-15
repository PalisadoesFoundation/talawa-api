const signup = require('../../src/resolvers/auth_mutations/signup');
const database = require('../../db');
const shortid = require('shortid');

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});

describe('Block user functionality tests', () => {
  test('Organization unblocks user after being unblocked already', async () => {
    const nameForNewUser = shortid.generate().toLowerCase();
    const email = `${nameForNewUser}@test.com`;
    const args = {
      data: {
        firstName: nameForNewUser,
        lastName: nameForNewUser,
        email: email,
        password: 'password',
      },
    };
    const response = await signup({}, args);

    expect(response).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        user: expect.objectContaining({
          firstName: nameForNewUser,
          lastName: nameForNewUser,
          email: email,
        }),
      })
    );
  });
});
