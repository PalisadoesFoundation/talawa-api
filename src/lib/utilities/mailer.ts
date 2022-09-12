import nodemailer from 'nodemailer';
import { ERROR_IN_SENDING_MAIL } from '../../constants';

export interface Interface_MailFields {
  emailTo: string;
  subject: string;
  body: string;
}

export const mailer = (mailFields: Interface_MailFields) => {
  // Nodemailer configuration
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  let mailOptions = {
    from: 'Talawa<>noreply@gmail.com',
    to: mailFields.emailTo,
    subject: mailFields.subject,
    html: mailFields.body,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        reject(ERROR_IN_SENDING_MAIL);
      } else {
        resolve(info);
      }
    });
  });
};
