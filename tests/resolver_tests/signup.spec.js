const signup = require('../../src/resolvers/auth_mutations/signup');
const database = require('../../db');

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});

describe('Block user functionality tests', () => {
  test('Organization unblocks user after being unblocked already', async () => {
    const args = {
      data: {
        firstName: 'testdb2',
        lastName: 'testdb2',
        email: 'testdb2@test.com',
        password: 'password',
      },
    };

    expect(await signup({}, args)).toEqual(
      expect.objectContaining({
        message: 'User is not authorized for performing this operation',
        status: 422,
      })
    );
  });
});
