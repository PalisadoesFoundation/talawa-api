import nodemailer from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import {
  ERROR_IN_SENDING_MAIL,
  MAIL_PASSWORD,
  MAIL_USERNAME,
  SMTP_OPTIONS,
} from "../constants";

export interface Interface_MailFields {
  emailTo: string;
  subject: string;
  body: string;
}

export const mailer = (mailFields: Interface_MailFields) => {
  // Nodemailer configuration
  let transporter: any;

  // For using custom smtp server
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
