const sgMail = require('@sendgrid/mail');
const otp = require('otp-generator');

const gridKey = process.env.GRID_KEY;

sgMail.setApiKey(gridKey);

let required_otp;

const sendConfirmationEmail = async (email) => {
  try {
    required_otp = otp.generate(6, {
      alphabets: false,
      digits: true,
      upperCase: false,
      specialChars: false,
    });

    await sgMail.send({
      to: email,
      from: process.env.MAIL_ID,
      subject: 'Welcome To Talawa',
      html: `<h2>Your otp is <strong> ${required_otp} </strong></h2>`,
    });

    return required_otp;
  } catch (e) {
    throw new Error(e);
  }
};

module.exports = { sendConfirmationEmail };
