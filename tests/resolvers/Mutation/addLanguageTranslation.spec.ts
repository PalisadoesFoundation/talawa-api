import "dotenv/config";
import { addLanguageTranslation as addLanguageTranslationResolver } from "../../../src/resolvers/Mutation/addLanguageTranslation";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import type { MutationAddLanguageTranslationArgs } from "../../../src/types/generatedGraphQLTypes";
import { Language } from "../../../src/models";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";

const randomValue = nanoid().toLowerCase();
let MONGOOSE_INSTANCE: typeof mongoose;

const testArgs: MutationAddLanguageTranslationArgs[] = [
  {
    data: {
      en_value: `english${randomValue}`,
      translation_lang_code: `en${randomValue}`,
      translation_value: `english${randomValue}`,
    },
  },
  {
    data: {
      en_value: `english${randomValue}`,
      translation_lang_code: `en${randomValue}`,
      translation_value: `notEnglish${randomValue}`,
    },
  },
  {
    data: {
      en_value: `english${randomValue}`,
      translation_lang_code: `chi${randomValue}`,
      translation_value: `英语${randomValue}`,
    },
  },
];

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> addLanguageTranslation", () => {
  it(`if no language exists with en === args.data.en_value creates language
  and returns it`, async () => {
    const args: MutationAddLanguageTranslationArgs = testArgs[0];

    const addLanguageTranslationPayload =
      await addLanguageTranslationResolver?.({}, args, {});

    const createdLanguage = await Language.findOne({
      en: testArgs[0].data.en_value,
    }).lean();

    expect(addLanguageTranslationPayload).toEqual(createdLanguage);
  });

  it(`throws ConflictError if translation.lang_code === args.data.translation_lang_code
  for language with en === args.data.en_value`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => `Translated ${message}`,
    );
    try {
      const args: MutationAddLanguageTranslationArgs = testArgs[1];

      await addLanguageTranslationResolver?.({}, args, {});
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated translation.alreadyPresent`,
      );
    }
  });

  it(`updates language.translation with new values if
  translation.lang_code !== args.data.translation_lang_code for existing language with
  en === args.en_value`, async () => {
    const args: MutationAddLanguageTranslationArgs = testArgs[2];

    const addLanguageTranslationPayload =
      await addLanguageTranslationResolver?.({}, args, {});

    expect(addLanguageTranslationPayload).toEqual(
      expect.objectContaining({
        en: testArgs[0].data.en_value,
        translation: expect.arrayContaining([
          expect.objectContaining({
            lang_code: testArgs[0].data.translation_lang_code,
            value: testArgs[0].data.translation_value,
          }),
          expect.objectContaining({
            lang_code: testArgs[2].data.translation_lang_code,
            value: testArgs[2].data.translation_value,
          }),
        ]),
      }),
    );
  });
});
