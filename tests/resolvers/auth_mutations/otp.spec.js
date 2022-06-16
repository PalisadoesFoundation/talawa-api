const shortid = require('shortid');

const database = require('../../../db');
const getToken = require('../../functions/getToken');
const otp = require('../../../lib/resolvers/auth_mutations/otp');

let generatedEmail;
let token;
let otpToken;

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
    console.log(otpToken, token);

    const args = {
      data: {
        email: generatedEmail,
      },
    };

    const response = await otp({}, args);
    expect(response).toBeFalsy();
  });
});
