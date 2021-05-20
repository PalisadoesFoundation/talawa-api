const Otp = require('../../models/Otp');
const User = require('../../models/User');
const { sendConfirmationEmail } = require('../functions/sendMail');

const sendOtp = async (parent, args) => {
  const emailTaken = await User.findOne({
    email: args.email.toLowerCase(),
  });
  if (emailTaken) {
    throw new Error('Email address taken.');
  }

  const email = args.email.toLowerCase();

  const otp_text = await sendConfirmationEmail(email);

  //If the otp is already sent and the user has clicked resend otp in frontend then the existing object will get updated

  const otp_already_sent_previously = await Otp.findOne({ email });

  if (otp_already_sent_previously) {
    try {
      await otp_already_sent_previously.overwrite({
        text: otp_text,
        email,
      });
      otp_already_sent_previously.save();
      return { message: 'Otp sent successfully' };
    } catch (e) {
      throw new Error(e);
    }
  }

  try {
    const otp = new Otp({
      text: otp_text,
      email,
    });

    await otp.save();

    return { message: 'Otp sent successfully' };
  } catch (e) {
    throw new Error(email);
  }
};

module.exports = sendOtp;
