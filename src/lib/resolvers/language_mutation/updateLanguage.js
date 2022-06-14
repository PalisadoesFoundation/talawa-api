const User = require('../../models/User');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const updateLanguage = async (parent, args, context) => {
  // gets user in token - to be used later on
  const userFound = await User.findOne({
    _id: context.userId,
  });
  if (!userFound) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
        ? 'User not found'
        : requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
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
