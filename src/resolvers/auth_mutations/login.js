const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const {
  createAccessToken,
  createRefreshToken,
} = require('../../helper_functions/auth');
const { NotFoundError, ValidationError } = require('errors');
const requestContext = require('talawa-request-context');
const copyToClipboard = require('../functions/copyToClipboard');

module.exports = async (parent, args) => {
  const user = await User.findOne({ email: args.data.email.toLowerCase() });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  const isEqual = await bcrypt.compare(args.data.password, user._doc.password);

  if (!isEqual) {
    throw new ValidationError(
      [
        {
          message: requestContext.translate('invalid.credentials'),
          code: 'invalid.credentials',
          param: 'credentials',
        },
      ],
      requestContext.translate('invalid.credentials')
    );
  }

  const accessToken = await createAccessToken(user);
  const refreshToken = await createRefreshToken(user);

  copyToClipboard(`{
  "Authorization": "Bearer ${accessToken}"
}`);

  return {
    user: {
      ...user._doc,
      password: null,
    },
    accessToken,
    refreshToken,
  };
};
