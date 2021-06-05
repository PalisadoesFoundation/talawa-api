const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const User = require('../../models/User');

module.exports = async (parent, args, context) => {
  //Ensure user exists
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  return {
    ...user._doc,
    password: null,
  };
};
