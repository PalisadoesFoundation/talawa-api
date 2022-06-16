const axios = require('axios');
const shortid = require('shortid');

const { URL } = require('../../../constants');
const getToken = require('../../functions/getToken');

let generatedEmail;
let token;
let otpToken;

beforeAll(async () => {
  generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  token = await getToken(generatedEmail);
});

describe('Testing otp resolver', () => {
  test('otp', async () => {
    console.log(otpToken);
    const response = await axios.post(
      URL,
      {
        query: `
            mutation {
                otp(data: {
                    email: "${generatedEmail}"
                }) {
                    otpToken
                }
            }
            `,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const { data } = response;
    expect(data.data).toBeFalsy();
  });
});
