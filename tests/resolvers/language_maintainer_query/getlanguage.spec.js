const getLanguageQuery = require('../../../lib/resolvers/language_maintainer_query/getlanguage');
const languageTranslationMutation = require('../../../lib/resolvers/language_maintainer_mutation/addLanguageTranslation');
const database = require('../../../db');
const shortid = require('shortid');

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();

  const uniqueId = shortid.generate().toLowerCase();
  const enValue = `hello world ${uniqueId}`;
  const translationInDiffLanguage = {
    de: `hallo welt ${uniqueId}`,
    en: `hello world ${uniqueId}`,
    es: `hola mundo ${uniqueId}`,
    fr: `bonjour le monde ${uniqueId}`,
    hi: `नमस्ते दुनिया ${uniqueId}`,
    ja: `こんにちは世界 ${uniqueId}`,
    pt: `olá mundo ${uniqueId}`,
    zh: `你好世界 ${uniqueId}`,
    ur: `ہیلو دنیا ${uniqueId}`,
  };
  const langCode = ['de', 'en', 'es', 'fr', 'hi', 'ja', 'pt', 'zh'];
  const randomIndex = getRandomInt(8);
  const getTranslationLangCode = langCode[randomIndex];
  const args = {
    data: {
      en_value: enValue,
      translation_lang_code: getTranslationLangCode,
      translation_value: translationInDiffLanguage[getTranslationLangCode],
    },
  };

  await languageTranslationMutation({}, args);
});

afterAll(() => {
  database.disconnect();
});

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

describe('Language Query testing', () => {
  const langCode = ['de', 'en', 'es', 'fr', 'hi', 'ja', 'pt', 'zh'];
  const randomIndex = getRandomInt(8);
  const getTranslationLangCode = langCode[randomIndex];

  test('Get Translation', async () => {
    const args = {
      lang_code: getTranslationLangCode,
    };

    const response = await getLanguageQuery({}, args);

    //NEW LANGUAGE PACKET ADDED
    expect(response).toEqual(expect.any(Array));
  });
});
