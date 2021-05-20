const Otp = require('../models/Otp');

const confirmOtp = async (email, otp) => {
  let otp_object;

  //finding otp with given fields

  try {
    otp_object = await Otp.findOne({
      email,
      text: otp,
    });
  } catch (e) {
    throw new Error(e);
  }

  if (!otp_object) {
    throw new Error('Incorrect Otp');
  }

  return otp_object;
};

module.exports = { confirmOtp };
