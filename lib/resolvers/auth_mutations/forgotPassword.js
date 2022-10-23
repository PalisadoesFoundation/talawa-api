const bcrypt = require('bcryptjs');
const jwt_decode = require('jwt-decode');

const { INVALID_OTP } = require('../../../constants');

const User = require('../../models/User');

module.exports = async (parent, args) => {
  const { userOtp, newPassword, otpToken } = args.data;

  const { email, otp } = jwt_decode(otpToken);

  const isOtpValid = await bcrypt.compare(userOtp, otp);

  if (!isOtpValid) {
    throw new Error(INVALID_OTP);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  const isChanges = await User.findOneAndUpdate(
    { email },
    { password: hashedPassword }
  );

  if (isChanges) {
    return true;
  }

  return false;
};
