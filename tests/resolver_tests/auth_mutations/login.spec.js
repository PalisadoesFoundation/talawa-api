const signup = require('../../../lib/resolvers/auth_mutations/signup');
const login = require('../../../lib/resolvers/auth_mutations/login');
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
  test('Login Mutation', async () => {
    // SignUp the User
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
    await signup({}, args);

    //Login User
    args = {
      data: {
        email: email,
        password: 'password',
      },
    };
    const response = await login({}, args);

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
