import { QueryResolvers, Translation } from "../../../generated/graphqlCodegen";
import { Language } from "../../models";

/**
 * This query fetch a language for specified `lang_code` from the database.
 * @param _parent 
 * @param args - An object that contains `lang_code`.
 * @returns An object `filteredLanguages`.
 */
export const getlanguage: QueryResolvers["getlanguage"] = async (
  _parent,
  args
) => {
  const languages = await Language.find({
    "translation.lang_code": args.lang_code,
  }).lean();

  const filteredLanguages: Array<Translation> = [];

  languages.forEach((language) => {
    language.translation.forEach((languageModel) => {
      if (languageModel.lang_code === args.lang_code) {
        filteredLanguages.push({
          lang_code: languageModel.lang_code,
          en_value: language.en,
          translation: languageModel.value,
          verified: languageModel.verified,
        });
      }
    });
  });

  return filteredLanguages;
};
