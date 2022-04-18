const User = require('../../models/User');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

module.exports = async (parent, args) => {
  const user = await User.findOne({
    _id: args.userId,
  });

  if (!user) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
        ? 'User not found'
        : requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  return user.appLanguageCode;
};
