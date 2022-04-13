const User = require('../../models/User');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  NOT_FOUND_USER_MESSAGE,
  NOT_FOUND_USER_CODE,
  NOT_FOUND_USER_PARAM,
  NOT_FOUND_USER_TEST,
} = require('../../../constants');

const updateLanguage = async (parent, args, context) => {
  // gets user in token - to be used later on
  const userFound = await User.findOne({
    _id: context.userId,
  });
  if (!userFound) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
        ? NOT_FOUND_USER_TEST
        : requestContext.translate(NOT_FOUND_USER_MESSAGE),
      NOT_FOUND_USER_CODE,
      NOT_FOUND_USER_PARAM
    );
  }

  //UPDATE LANGUAGE
  userFound.overwrite({
    ...userFound._doc,
    appLanguageCode: args.languageCode,
  });

  await userFound.save();

  return userFound;
};

module.exports = updateLanguage;
