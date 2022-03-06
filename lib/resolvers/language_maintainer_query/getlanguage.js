const Language = require('../../models/Language');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const getLanguage = async (parent, args) => {
  const translationFound = await Language.find({
    'translation.lang_code': args.lang_code,
  });

  if (!translationFound) {
    throw new NotFoundError(
      requestContext.translate('translation.notFound'),
      'translation.notFound',
      'translationNotFound'
    );
  }

  let languages = [];
  translationFound.forEach((element) => {
    element.translation.forEach((translated) => {
      if (translated.lang_code === args.lang_code) {
        languages.push({
          lang_code: translated.lang_code,
          en_value: element.en,
          translation: translated.value,
          verified: translated.verified,
        });
      }
    });
  });

  return languages;
};

module.exports = getLanguage;
