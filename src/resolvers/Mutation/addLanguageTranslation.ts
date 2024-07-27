import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { Language } from "../../models";
import type { InterfaceLanguage } from "../../models";
import { TRANSLATION_ALREADY_PRESENT_ERROR } from "../../constants";

/**
 * Mutation resolver function to add a translation for a language.
 *
 * This function performs the following actions:
 * 1. Checks if the language with the provided English value exists in the database.
 * 2. If the language exists, checks if the translation for the specified language code already exists.
 * 3. If the translation already exists, throws a conflict error.
 * 4. If the translation does not exist, updates the language with the new translation.
 * 5. If the language does not exist, creates a new language entry with the provided translation.
 *
 * @param _parent - The parent object for the mutation. Typically, this is not used in this resolver.
 * @param args - The arguments for the mutation, including:
 *   - `data.en_value`: The English value of the language to which the translation is being added.
 *   - `data.translation_lang_code`: The language code for the translation being added.
 *   - `data.translation_value`: The translation value to be added.
 *
 * @returns A promise that resolves to the updated or newly created language document.
 *
 * @see Language - The Language model used to interact with the languages collection in the database.
 * @see MutationResolvers - The type definition for the mutation resolvers.
 *
 * @remarks
 * The function uses the `findOne` method to locate an existing language entry by its English value.
 * If the language exists, it checks the existing translations to prevent duplicate entries.
 * If the language does not exist, a nsnew entry is created with the provided tralation.
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
