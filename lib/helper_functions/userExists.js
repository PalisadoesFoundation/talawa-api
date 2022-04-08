const User = require('../models/User');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

module.exports = async (id) => {
  const user = await User.findOne({ _id: id });
  if (!user) {
    throw new NotFoundError(
      // requestContext.translate('user.notFound'),
      process.env.NODE_ENV !== 'production'
        ? 'User not found'
        : requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }
  return user;
};
