import nodemailer from "nodemailer";
import { ERROR_IN_SENDING_MAIL } from "../../constants";

// structure for Interface_MailFields.
export interface Interface_MailFields {
  emailTo: string;
  subject: string;
  body: string;
}

/**
 * This function sends emails to the specified user using the node mailer module.
 * @remarks
 * This is a utility method.
 *
 * @param Interface_MailFields - `Interface` type with emailTo(`string`), subject(`string`), and body(`string`) necessary attributes.
 * @returns Promise along with resolve and reject methods. 
 */
export const mailer = (mailFields: Interface_MailFields) => {
  // Nodemailer configuration
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
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
