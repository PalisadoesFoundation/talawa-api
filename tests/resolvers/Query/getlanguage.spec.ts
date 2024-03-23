import "dotenv/config";
import { getlanguage as getLanguageResolver } from "../../../src/resolvers/Query/getlanguage";
import { connect, disconnect } from "../../helpers/db";
import type { Document } from "mongoose";
import type mongoose from "mongoose";
import type { InterfaceLanguage } from "../../../src/models";
import { Language } from "../../../src/models";

import type { QueryGetlanguageArgs } from "../../../src/types/generatedGraphQLTypes";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let MONGOOSE_INSTANCE: typeof mongoose;
let testLanguages: (InterfaceLanguage &
  Document<unknown, unknown, InterfaceLanguage>)[];

const enValue = `en ${nanoid().toLowerCase()}`;
const deValue = `de ${nanoid().toLowerCase()}`;
const frValue = `fr ${nanoid().toLowerCase()}`;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  testLanguages = await Language.insertMany([
    {
      en: enValue,
      translation: [
        {
          lang_code: enValue,
          value: "value1",
          verified: true,
        },
      ],
    },
    {
      en: deValue,
      translation: [
        {
          lang_code: enValue,
          value: "value2",
          verified: false,
        },
      ],
    },
    {
      en: frValue,
      translation: [
        {
          lang_code: deValue,
          value: "value3",
          verfied: true,
        },
      ],
    },
  ]);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> getLanguage", () => {
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
          translation: "value1",
          verified: true,
        }),
        expect.objectContaining({
          lang_code: enValue,
          en_value: deValue,
          translation: "value2",
          verified: false,
        }),
      ]),
    );
  });
});
