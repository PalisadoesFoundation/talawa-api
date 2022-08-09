const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const shortid = require('shortid');
const { INVALID_OTP } = require('../../../constants');

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

  test('Testing, when user otp is incorrect', async () => {
    const args = {
      data: {
        userOtp: '54321',
        newPassword: 'newPassword',
        otpToken: otpToken,
      },
    };

    await expect(async () => {
      await forgotPassword({}, args);
    }).rejects.toEqual(Error(INVALID_OTP));
  });

  test('Testing, when user email is incorrect', async () => {
    const fakeOtpToken = jwt.sign(
      { email: 'abc321@email.com', otp: hashedOtp },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: '15m',
      }
    );

    const args = {
      data: {
        userOtp: '12345',
        newPassword: 'newPassword',
        otpToken: fakeOtpToken,
      },
    };

    const response = await forgotPassword({}, args);
    expect(response).toBeFalsy();
  });
});
