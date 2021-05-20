const Otp = require('../../models/Otp');
const { sendConfirmationEmail } = require('../functions/sendMail');

const sendOtp = async (parent, args) => {
  const email = args.email;
  const otp_text = sendConfirmationEmail(email);

  try {
    const otp = new Otp({
      text: otp_text,
    });

    const return_id = otp._id;

    return return_id;
  } catch (e) {
    throw new Error(email);
  }
};

module.exports = sendOtp;
