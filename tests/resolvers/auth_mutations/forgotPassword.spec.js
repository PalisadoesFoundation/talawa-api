const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const shortid = require('shortid');

const { URL } = require('../../../constants');
const getToken = require('../../functions/getToken');

let token;
let hashedOtp;
let otpToken;

beforeAll(async () => {
  require('dotenv').config();

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

describe('Testing forgotPassword resolver', () => {
  test('forgotPassword', async () => {
    const response = await axios.post(URL, {
      query: `
            mutation {
                forgotPassword(data: {
                    userOtp:"12345",
                    newPassword:"newPassword", 
                    otpToken:"${otpToken}"
                })
            }
            `,
    });

    const { data } = response;
    expect(data.data.forgotPassword).toEqual(true);
  });
});
