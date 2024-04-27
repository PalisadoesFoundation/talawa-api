import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { Language } from "../../models";
import type { InterfaceLanguage } from "../../models";
import { TRANSLATION_ALREADY_PRESENT_ERROR } from "../../constants";
/**
 * This function adds language translation.
 * @param _parent - parent of current request
 * @param args - payload provided with the request
 * @remarks The following checks are done:
 * 1. If the language exists
 * 2. If the translation already exists.
 * @returns Updated langauge
 */
export const addLanguageTranslation: MutationResolvers["addLanguageTranslation"] =
  async (_parent, args) => {
    const language = await Language.findOne({
      en: args.data.en_value,
    }).lean();

    // Checks if language exists.
    if (language) {
      language.translation.forEach((element) => {
        // Checks whether the translation already exists.
        if (element.lang_code === args.data.translation_lang_code) {
          throw new errors.ConflictError(
            requestContext.translate(TRANSLATION_ALREADY_PRESENT_ERROR.MESSAGE),
            TRANSLATION_ALREADY_PRESENT_ERROR.CODE,
            TRANSLATION_ALREADY_PRESENT_ERROR.PARAM,
          );
        }
      });

      // Updates language with new translation and returns the updated language.
      return (await Language.findOneAndUpdate(
        {
          en: args.data.en_value,
        },
        {
          $push: {
            translation: {
              lang_code: args.data.translation_lang_code,
              value: args.data.translation_value,
            },
          },
        },
        {
          new: true,
        },
      ).lean()) as InterfaceLanguage;
    }

    // Creates new language.
    const createdLanguage = await Language.create({
      en: args.data.en_value,
      translation: [
        {
          lang_code: args.data.translation_lang_code,
          value: args.data.translation_value,
        },
      ],
    });

    return createdLanguage.toObject();
  };
