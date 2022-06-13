const axios = require('axios');

const { URL } = require('../../../constants');

describe('Testing recaptcha resolver', () => {
  test('recaptcha', async () => {
    const response = await axios.post(URL, {
      query: `
            mutation {
                recaptcha(data: {
                    recaptchaToken:"dummyToken"
                })
            }
            `,
    });

    const { data } = response;
    expect(data.data.recaptcha).toEqual(false);
  });
});
