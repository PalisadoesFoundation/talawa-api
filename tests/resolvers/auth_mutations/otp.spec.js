const shortid = require('shortid');
const { USER_NOT_FOUND, ERROR_IN_SENDING_MAIL } = require('../../../constants');

const database = require('../../../db');
const otp = require('../../../lib/resolvers/auth_mutations/otp');
const getToken = require('../../functions/getToken');

let generatedEmail;
let token;

beforeAll(async () => {
  require('dotenv').config();
  await database.connect();

  generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  token = await getToken(generatedEmail);
});

afterAll(() => {
  database.disconnect();
});

describe('Testing otp resolver', () => {
  test('otp', async () => {
    console.log(token);

    const args = {
      data: {
        email: generatedEmail,
      },
    };

    await expect(() => otp({}, args)).rejects.toEqual(ERROR_IN_SENDING_MAIL);
  });

  test('Testing, when user email is incorrect', async () => {
    const args = {
      data: {
        email: 'abc4321@email.com',
      },
    };

    await expect(async () => {
      await otp({}, args);
    }).rejects.toEqual(Error(USER_NOT_FOUND));
  });
});
