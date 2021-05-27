const requestContext = require('../core/libs/talawa-request-context');
const { defaultLocale } = require('../config/app');
const { InternalServerError } = require('./errors');

module.exports = (key, language) => {
  const translatedMessage = requestContext.translate(key)[language];
  const defaultMessage = requestContext.translate(key)[defaultLocale];

  if (translatedMessage) return translatedMessage;
  if (defaultMessage) return defaultMessage;
  throw new InternalServerError(
    'Translation failure',
    'translation.failure',
    'i18n'
  );
};
