import { QueryResolvers, Translation } from "../../types/generatedGraphQLTypes";
import { Language } from "../../models";

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
