const User = require('../models/User');
const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

module.exports = async (id) => {
  try {
    const user = await User.findOne({ _id: id });
    if (!user) {
      throw new NotFoundError(
        requestContext.translate('user.notFound'),
        'user.notFound',
        'user'
      );
    }
    return user;
  } catch (err) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }
};
