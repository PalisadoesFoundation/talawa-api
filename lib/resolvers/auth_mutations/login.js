const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const {
  createAccessToken,
  createRefreshToken,
} = require('../../helper_functions/auth');
const { NotFoundError, ValidationError } = require('errors');
const requestContext = require('talawa-request-context');
const copyToClipboard = require('../functions/copyToClipboard');
const {
  NOT_FOUND_USER_CODE,
  NOT_FOUND_USER_PARAM,
  NOT_FOUND_USER_MESSAGE,
  INVALID_CREDENTIALS_MESSAGE,
  INVALID_CREDENTIALS_CODE,
  INVALID_CREDENTIALS_PARAM,
} = require('../../../constants');

module.exports = async (parent, args) => {
  const user = await User.findOne({ email: args.data.email.toLowerCase() });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate(NOT_FOUND_USER_MESSAGE),
      NOT_FOUND_USER_CODE,
      NOT_FOUND_USER_PARAM
    );
  }

  const isEqual = await bcrypt.compare(args.data.password, user._doc.password);

  if (!isEqual) {
    throw new ValidationError(
      [
        {
          message: requestContext.translate(INVALID_CREDENTIALS_MESSAGE),
          code: INVALID_CREDENTIALS_CODE,
          param: INVALID_CREDENTIALS_PARAM,
        },
      ],
      requestContext.translate(INVALID_CREDENTIALS_MESSAGE)
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
