const jwt = require('jsonwebtoken');
/**
 * This function creates a json web token which expires in 15 minutes.
 * It signs the given payload(user data) into a JSON Web Token string payload.
 * @param {*} user - User data
 * @returns JSON Web Token string payload
 */
module.exports.createAccessToken = async (user) => {
  const userId = user.id;
  return jwt.sign(
    {
      tokenVersion: user.tokenVersion,
      userId,
      firstName: user._doc.firstName,
      lastName: user._doc.lastName,
      email: user._doc.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );
};

/**
 * This function creates a json web token which expires in 30 days.
 * It signs the given payload(user data) into a JSON Web Token string payload.
 * @param {*} user - User data
 * @returns JSON Web Token string payload
 */
module.exports.createRefreshToken = async (user) => {
  const userId = user.id;
  return jwt.sign(
    {
      tokenVersion: user.tokenVersion,
      userId,
      firstName: user._doc.firstName,
      lastName: user._doc.lastName,
      email: user._doc.email,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '30d' }
  );
};
