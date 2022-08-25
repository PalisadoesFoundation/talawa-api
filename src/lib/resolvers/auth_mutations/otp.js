const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../../models');
const { mailer } = require('../../utilities/mailer');
const { USER_NOT_FOUND } = require('../../../constants');

module.exports = async (parent, args) => {
  const { email } = args.data;

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error(USER_NOT_FOUND);
  }

  const username = `${user.firstName} ${user.lastName}`;

  const otp = (Math.floor(Math.random() * 10000) + 9999).toString();

  const hashedOtp = await bcrypt.hash(otp, 10);

  const otpToken = jwt.sign(
    { email, otp: hashedOtp },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: '15m',
    }
  );

  const subject = 'OTP for Talawa-admin forgot password';
  const body = `<h2>Hi, ${username}</h2><p>Your OTP: ${otp}</p> <p>Your OTP will expires in 5 minutes.</p><br><br> <small>Do not share your otp with others.</small>`;

  return mailer(email, subject, body).then((info) => {
    console.log(info);
    return { otpToken };
  });
};
