import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import {
  ERROR_IN_SENDING_MAIL,
  MAIL_PASSWORD,
  MAIL_USERNAME,
  SMTP_OPTIONS,
} from "../constants";

export interface InterfaceMailFields {
  emailTo: string;
  subject: string;
  body: string;
}
/**
 * This function sends emails to the specified user using the node mailer module.
 * @remarks
 * This is a utility method.
 *
 * @param InterfaceMailFields - `Interface` type with emailTo(`string`), subject(`string`), and body(`string`) necessary attributes.
 * @returns Promise along with resolve and reject methods.
 */
export const mailer = (mailFields: InterfaceMailFields): Promise<any> => {
  // Nodemailer configuration
  let transporter: any;

  // For using custom smtp server
  /* c8 ignore next 12 */
  if (SMTP_OPTIONS.IS_SMTP === "true") {
    transporter = nodemailer.createTransport({
      host: String(SMTP_OPTIONS.SMTP_HOST),
      port: Number(SMTP_OPTIONS.SMTP_PORT),
      secure: SMTP_OPTIONS.SMTP_SSL_TLS === "true" ? true : false,
      auth: {
        user: SMTP_OPTIONS.SMTP_USERNAME,
        pass: SMTP_OPTIONS.SMTP_PASSWORD,
      },
    } as SMTPTransport.Options);
    // For using gmail transporter
  } else {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: MAIL_USERNAME,
        pass: MAIL_PASSWORD,
      },
    });
  }

  const mailOptions = {
    /* c8 ignore next 6 */
    from:
      SMTP_OPTIONS.IS_SMTP === "false" || SMTP_OPTIONS.IS_SMTP === undefined
        ? "Talawa<>noreply@gmail.com"
        : SMTP_OPTIONS.SMTP_USERNAME,
    to: mailFields.emailTo,
    subject: mailFields.subject,
    html: mailFields.body,
  };
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, function (error: any, info: unknown) {
      if (error) {
        reject(ERROR_IN_SENDING_MAIL);
      } else {
        resolve(info);
      }
    });
  });
};
