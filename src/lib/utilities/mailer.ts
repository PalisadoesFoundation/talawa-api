import nodemailer from 'nodemailer';
import { ERROR_IN_SENDING_MAIL } from '../../constants';

export interface Interface_MailFields {
  emailTo: string;
  subject: string;
  body: string;
}

export const mailer = (email: any, subject: any, body: any) => {
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
