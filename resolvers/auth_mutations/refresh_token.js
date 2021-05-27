const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const {
  createAccessToken,
  createRefreshToken,
} = require('../../helper_functions/auth');
const { ValidationError, NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

module.exports = async (parent, args) => {
  // This route should not be protected because the access token will be expired
  const refreshToken = args.refreshToken;
  if (!refreshToken) {
    throw new ValidationError(
      [
        {
          message: requestContext.translate('invalid.refreshToken'),
          code: 'invalid.refreshToken',
          param: 'refreshToken',
        },
      ],
      requestContext.translate('invalid.refreshToken')
    );
  }

  let payload = null;

  payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

  // The refresh token received is valid so we cna send a new access token
  const user = await User.findOne({ _id: payload.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  if (user.tokenVersion !== payload.tokenVersion) {
    throw new ValidationError(
      [
        {
          message: requestContext.translate('invalid.refreshToken'),
          code: 'invalid.refreshToken',
          param: 'refreshToken',
        },
      ],
      requestContext.translate('invalid.refreshToken')
    );
  }

  // send new access and refresh token to user
  const newAccessToken = await createAccessToken(user);
  const newRefreshToken = await createRefreshToken(user);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};
