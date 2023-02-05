import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { Language } from "../../models";

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
            requestContext.translate("translation.alreadyPresent"),
            "translation.alreadyPresent",
            "translationAlreadyPresent"
          );
        }
      });

      // Updates language with new translation and returns the updated language.
      return await Language.findOneAndUpdate(
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
        }
      ).lean();
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
