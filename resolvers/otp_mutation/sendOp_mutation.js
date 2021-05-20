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

  const otp_already_sent_previously = await Otp.findOne({ email });

  if (otp_already_sent_previously) {
    try {
      await otp_already_sent_previously.overwrite({
        text: otp_text,
      });
      return 'Otp sent successfully';
    } catch (e) {
      throw new Error(e);
    }
  }

  try {
    const otp = new Otp({
      text: otp_text,
    });

    const return_id = otp._id;
    console.log(return_id);

    return 'Otp sent successfully';
  } catch (e) {
    throw new Error(email);
  }
};

module.exports = sendOtp;
