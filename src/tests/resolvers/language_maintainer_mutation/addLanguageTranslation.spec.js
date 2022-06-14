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
    ur: `ہیلو دنیا ${uniqueId}`,
  };
  const langCode = ['de', 'en', 'es', 'fr', 'hi', 'ja', 'pt', 'zh'];
  const randomIndex = getRandomInt(8);
  const getTranslationLangCode = langCode[randomIndex];

  test('New Translation', async () => {
    const translationLangCode = getTranslationLangCode;

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
    langCode[randomIndex] = 'ur';
    const newTranslationLangCode = langCode[getRandomInt(8)];
    const newArgs = {
      data: {
        en_value: enValue,
        translation_lang_code: newTranslationLangCode,
        translation_value: translationInDiffLanguage[newTranslationLangCode],
      },
    };

    const newResponse = await languageTranslationMutation({}, newArgs);
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

    expect(newFinalResult).toEqual({
      en: enValue,
      translation: {
        lang_code: newTranslationLangCode,
        value: translationInDiffLanguage[newTranslationLangCode],
      },
    });
  });

  test('Translation already existing in packet', async () => {
    const translationLangCode = getTranslationLangCode;
    const newArgs = {
      data: {
        en_value: enValue,
        translation_lang_code: translationLangCode,
        translation_value: `${translationInDiffLanguage[translationLangCode]} 123`,
      },
    };

    await expect(async () => {
      await languageTranslationMutation({}, newArgs);
    }).rejects.toEqual(Error('Already Present'));
  });
});
