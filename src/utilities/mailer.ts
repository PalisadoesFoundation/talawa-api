import nodemailer from "nodemailer";
import { ERROR_IN_SENDING_MAIL, MAIL_PASSWORD, MAIL_USERNAME } from "../constants";

export interface Interface_MailFields {
  emailTo: string;
  subject: string;
  body: string;
}

export const mailer = (mailFields: Interface_MailFields) => {
  // Nodemailer configuration
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: MAIL_USERNAME,
      pass: MAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: "Talawa<>noreply@gmail.com",
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
