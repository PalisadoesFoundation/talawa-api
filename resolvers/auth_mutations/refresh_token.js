
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const { createAccessToken, createRefreshToken } = require('../../helper_functions/auth');


module.exports = async (parent, args) => {
  // This route should not be protected because the access token will be expired
  const refreshToken = args.refreshToken;
  if (!refreshToken) {
    throw new Error('Invalid refresh Token');
  }

  let payload = null;

  payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

  // The refresh token received is valid so we cna send a new access token
  const user = await User.findOne({ _id: payload.userId });
  if (!user) {
    throw new Error('Invalid Credentials');
  }

  if (user.tokenVersion !== payload.tokenVersion) {
    throw new Error('Invalid refresh Token');
  }


  // send new access and refresh token to user
  const newAccessToken = await createAccessToken(user);
  const newRefreshToken = await createRefreshToken(user);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken
  };
};
