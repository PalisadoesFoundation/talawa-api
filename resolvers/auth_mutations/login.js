const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const {
  createAccessToken,
  createRefreshToken,
} = require('../../helper_functions/auth');

module.exports = async (parent, args) => {
  const user = await User.findOne({ email: args.data.email.toLowerCase() });
  if (!user) {
    throw new Error('Invalid Credentials');
  }

  const isEqual = await bcrypt.compare(args.data.password, user._doc.password);

  if (!isEqual) {
    throw new Error('Invalid Credentials');
  }

  const accessToken = await createAccessToken(user);
  const refreshToken = await createRefreshToken(user);

  return {
    user: {
      ...user._doc,
      password: null,
    },
    accessToken,
    refreshToken,
  };
};
