const languageTranslationMutation = require('../../../lib/resolvers/language_maintainer_mutation/addLanguageTranslation');
const database = require('../../../db');
const shortid = require('shortid');

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

describe('Language Mutation testing', () => {
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
  };
  const langCode = ['de', 'en', 'es', 'fr', 'hi', 'ja', 'pt', 'zh'];

  test('New Translation', async () => {
    const translationLangCode = langCode[getRandomInt(3)];

    const args = {
      data: {
        en_value: enValue,
        translation_lang_code: translationLangCode,
        translation_value: translationInDiffLanguage[translationLangCode],
      },
    };

    const response = await languageTranslationMutation({}, args);
    const finalResult = {
      en: response.en,
    };

    response.translation.forEach((element) => {
      if (element.lang_code === translationLangCode) {
        finalResult['translation'] = {
          lang_code: element.lang_code,
          value: element.value,
        };
      }
    });

    //NEW LANGUAGE PACKET ADDED
    expect(finalResult).toEqual({
      en: enValue,
      translation: {
        lang_code: translationLangCode,
        value: translationInDiffLanguage[translationLangCode],
      },
    });
  });

  test('New Translation in existing packet', async () => {
    const newTranslationLangCode = langCode[getRandomInt(3)];
    const newArgs = {
      data: {
        en_value: enValue,
        translation_lang_code: newTranslationLangCode,
        translation_value: translationInDiffLanguage[newTranslationLangCode],
      },
    };

    console.log(newArgs);
    console.log('New Response');
    const newResponse = await languageTranslationMutation({}, newArgs);
    console.log(newResponse);
    const newFinalResult = {
      en: newResponse.en,
    };

    newResponse.translation.forEach((newElement) => {
      if (newElement.lang_code === newTranslationLangCode) {
        newFinalResult['translation'] = {
          lang_code: newElement.lang_code,
          value: newElement.value,
        };
      }
    });

    console.log(newFinalResult);
    expect(newFinalResult).toEqual({
      en: enValue,
      translation: {
        lang_code: newTranslationLangCode,
        value: translationInDiffLanguage[newTranslationLangCode],
      },
    });
  });
});
