const updateLanguageMutation = require('../../../lib/resolvers/language_mutation/updateLanguage');
const database = require('../../../db');
const shortid = require('shortid');
const getUserId = require('../../functions/getUserIdFromSignup');

let userId;

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
  let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  userId = await getUserId(generatedEmail);
});

afterAll(() => {
  database.disconnect();
});

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

describe('Language Mutation testing', () => {
  const langCode = ['de', 'en', 'es', 'fr', 'hi', 'ja', 'pt', 'zh'];
  const randomIndex = getRandomInt(8);

  test('New User Language Update', async () => {
    const args = {
      languageCode: langCode[randomIndex],
    };

    const response = await updateLanguageMutation({}, args, {
      userId: userId,
    });
    expect(response).toEqual(
      expect.objectContaining({
        appLanguageCode: langCode[randomIndex],
      })
    );
  });

  test('User not exist in database language update', async () => {
    const args = {
      languageCode: langCode[randomIndex],
    };

    await expect(async () => {
      await updateLanguageMutation({}, args, {
        userId: '62277875e904753262f99ba9',
      });
    }).rejects.toEqual(Error('User not found'));
  });
});
