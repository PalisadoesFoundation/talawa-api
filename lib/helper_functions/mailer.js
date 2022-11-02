const nodemailer = require('nodemailer');

const { ERROR_IN_SENDING_MAIL } = require('../../constants');

/**
 * This function sends emails to the specified user using the node mailer module.
 * @param {string} email Receiver email address.
 * @param {string} subject Subject of the mail.
 * @param {string} body Body of the mail.
 * @returns {Promise} Promise along with resolve and reject methods. 
 */
const mailer = (email, subject, body) => {
  //NODEMAILER SPECIFIC STUFF
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  let mailOptions = {
    from: 'Talawa<>noreply@gmail.com',
    to: email,
    subject: subject,
    html: body,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        reject(ERROR_IN_SENDING_MAIL);
      } else {
        resolve(info);
      }
    });
  });
};

module.exports = mailer;
