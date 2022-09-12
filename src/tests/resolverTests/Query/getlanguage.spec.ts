import 'dotenv/config';
import { getlanguage as getLanguageResolver } from '../../../lib/resolvers/Query/getlanguage';
import database from '../../../db';
import { Interface_Language, Language } from '../../../lib/models';
import { Document } from 'mongoose';
import { QueryGetlanguageArgs } from '../../../generated/graphQLTypescriptTypes';
import { nanoid } from 'nanoid';

let testLanguages: (Interface_Language &
  Document<any, any, Interface_Language>)[];

const enValue = `en ${nanoid().toLowerCase()}`;
const deValue = `de ${nanoid().toLowerCase()}`;
const frValue = `fr ${nanoid().toLowerCase()}`;

beforeAll(async () => {
  await database.connect();

  testLanguages = await Language.insertMany([
    {
      en: enValue,
      translation: [
        {
          lang_code: enValue,
          value: 'value1',
          verified: true,
        },
      ],
    },
    {
      en: deValue,
      translation: [
        {
          lang_code: enValue,
          value: 'value2',
          verified: false,
        },
      ],
    },
    {
      en: frValue,
      translation: [
        {
          lang_code: deValue,
          value: 'value3',
          verfied: true,
        },
      ],
    },
  ]);
});

afterAll(async () => {
  await database.disconnect();
});

describe('resolvers -> Query -> getLanguage', () => {
  it(`returns list of all languages where language.translation.lang_code === args.lang_code`, async () => {
    const args: QueryGetlanguageArgs = {
      lang_code: testLanguages[0].en,
    };

    const getLanguagePayload = await getLanguageResolver?.({}, args, {});

    expect(getLanguagePayload).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          lang_code: enValue,
          en_value: enValue,
          translation: 'value1',
          verified: true,
        }),
        expect.objectContaining({
          lang_code: enValue,
          en_value: deValue,
          translation: 'value2',
          verified: false,
        }),
      ])
    );
  });
});
