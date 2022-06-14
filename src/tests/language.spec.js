const axios = require('axios');
const { URL } = require('../constants');
const getToken = require('./functions/getToken');
const shortid = require('shortid');

let token;
beforeAll(async () => {
  let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  token = await getToken(generatedEmail);
});

describe('language resolvers', () => {
  test('updateLanguage', async () => {
    const langaugeCodes = ['en', 'es', 'fr', 'hi', 'zh', 'de', 'ja', 'pt'];

    const languageCode =
      langaugeCodes[Math.floor(Math.random() * langaugeCodes.length)];

    const response = await axios.post(
      URL,
      {
        query: `
            mutation {
                updateLanguage(languageCode: "${languageCode}") {
                    _id
                    appLanguageCode
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
    expect(data.data.updateLanguage.appLanguageCode).toBe(languageCode);
  });
});
