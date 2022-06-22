const shortid = require('shortid');

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

    await expect(() => otp({}, args)).rejects.toEqual('Error in sending mail');
  });
});
