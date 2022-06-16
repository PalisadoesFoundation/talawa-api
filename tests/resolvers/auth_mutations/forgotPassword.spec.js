const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const shortid = require('shortid');

const database = require('../../../db');
const forgotPassword = require('../../../lib/resolvers/auth_mutations/forgotPassword');
const getToken = require('../../functions/getToken');

let hashedOtp;
let otpToken;
let token;

beforeAll(async () => {
  require('dotenv').config();
  await database.connect();

  let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  token = await getToken(generatedEmail);
  hashedOtp = await bcrypt.hash('12345', 10);
  otpToken = jwt.sign(
    { email: generatedEmail, otp: hashedOtp },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: '15m',
    }
  );
});

afterAll(() => {
  database.disconnect();
});

describe('Testing forgotPassword resolver', () => {
  test('forgotPassword', async () => {
    console.log(token);

    const args = {
      data: {
        userOtp: '12345',
        newPassword: 'newPassword',
        otpToken: otpToken,
      },
    };

    const response = await forgotPassword({}, args);
    expect(response).toBeTruthy();
  });
});
