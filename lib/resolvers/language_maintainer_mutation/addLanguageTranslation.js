const { ConflictError } = require('errors');
const Language = require('../../models/Language');
const requestContext = require('talawa-request-context');
const {
  CONFLICT_ALREADY_PRESENT_CODE,
  CONFLICT_ALREADY_PRESENT_MESSAGE,
  CONFLICT_ALREADY_PRESENT_PARAM,
  CONFLICT_ALREADY_PRESENT_TEST,
} = require('../../../constants');

const addLanguageTranslation = async (parent, args) => {
  const langValue = await Language.findOne({
    en: args.data.en_value,
  });

  if (langValue) {
    langValue.translation.forEach((element) => {
      if (element.lang_code === args.data.translation_lang_code) {
        throw new ConflictError(
          process.env.NODE_ENV !== 'production'
            ? CONFLICT_ALREADY_PRESENT_TEST
            : requestContext.translate(CONFLICT_ALREADY_PRESENT_MESSAGE),
          CONFLICT_ALREADY_PRESENT_CODE,
          CONFLICT_ALREADY_PRESENT_PARAM
        );
      }
    });

    const filter = {
      en: args.data.en_value,
    };

    const update = {
      $push: {
        translation: {
          lang_code: args.data.translation_lang_code,
          value: args.data.translation_value,
        },
      },
    };

    const langUpdate = await Language.findOneAndUpdate(filter, update, {
      new: true,
    });

    return langUpdate;
  }

  let lang = new Language({
    en: args.data.en_value,
    translation: [
      {
        lang_code: args.data.translation_lang_code,
        value: args.data.translation_value,
      },
    ],
  });

  lang = await lang.save();
  return lang._doc;
};

module.exports = addLanguageTranslation;
