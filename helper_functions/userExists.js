const User = require('../models/User');
const { NotFound } = require('../core/errors');
const requestContext = require('../core/libs/talawa-request-context');

module.exports = async (id) => {
  const user = await User.findOne({ _id: id });
  if (!user) {
    throw new NotFound(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }
  return user;
};
