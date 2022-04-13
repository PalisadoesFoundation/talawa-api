const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const {
  createAccessToken,
  createRefreshToken,
} = require('../../helper_functions/auth');
const { ValidationError, NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const {
  NOT_FOUND_USER_CODE,
  NOT_FOUND_USER_PARAM,
  NOT_FOUND_USER_MESSAGE,
  INVALID_REFRESH_TOKEN_CODE,
  INVALID_REFRESH_TOKEN_MESSAGE,
  INVALID_REFRESH_TOKEN_PARAM,
} = require('../../../constants');

module.exports = async (parent, args) => {
  // This route should not be protected because the access token will be expired
  const refreshToken = args.refreshToken;
  if (!refreshToken) {
    throw new ValidationError(
      [
        {
          message: requestContext.translate(INVALID_REFRESH_TOKEN_MESSAGE),
          code: INVALID_REFRESH_TOKEN_CODE,
          param: INVALID_REFRESH_TOKEN_PARAM,
        },
      ],
      requestContext.translate(INVALID_REFRESH_TOKEN_MESSAGE)
    );
  }

  let payload = null;

  payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

  // The refresh token received is valid so we cna send a new access token
  const user = await User.findOne({ _id: payload.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_USER_MESSAGE),
      NOT_FOUND_USER_CODE,
      NOT_FOUND_USER_PARAM
    );
  }

  if (user.tokenVersion !== payload.tokenVersion) {
    throw new ValidationError(
      [
        {
          message: requestContext.translate(INVALID_REFRESH_TOKEN_MESSAGE),
          code: INVALID_REFRESH_TOKEN_CODE,
          param: INVALID_REFRESH_TOKEN_PARAM,
        },
      ],
      requestContext.translate(INVALID_REFRESH_TOKEN_MESSAGE)
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
