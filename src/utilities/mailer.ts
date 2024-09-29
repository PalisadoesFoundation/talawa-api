import type { Transporter } from "nodemailer";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import {
  ERROR_IN_SENDING_MAIL,
  MAIL_PASSWORD,
  MAIL_USERNAME,
  SMTP_OPTIONS,
} from "../constants";

/**
 * Interface for the fields required to send an email.
 */
export interface InterfaceMailFields {
  emailTo: string; // Email address of the recipient
  subject: string; // Subject of the email
  body: string; // Body content of the email (HTML format)
}

/**
 * Sends an email using Nodemailer.
 * @remarks
 * This is a utility method for sending emails.
 * @param mailFields - An object containing emailTo, subject, and body fields.
 * @returns A promise resolving to `SMTPTransport.SentMessageInfo` on success, or an error string on failure.
 */
export const mailer = (
  mailFields: InterfaceMailFields,
): Promise<SMTPTransport.SentMessageInfo | string> => {
  // Nodemailer configuration
  let transporter: Transporter<SMTPTransport.SentMessageInfo>;

  // Check if custom SMTP server is configured
  if (SMTP_OPTIONS.IS_SMTP) {
    transporter = nodemailer.createTransport({
      host: String(SMTP_OPTIONS.SMTP_HOST),
      port: Number(SMTP_OPTIONS.SMTP_PORT),
      secure: SMTP_OPTIONS.SMTP_SSL_TLS,
      auth: {
        user: SMTP_OPTIONS.SMTP_USERNAME,
        pass: SMTP_OPTIONS.SMTP_PASSWORD,
      },
    } as SMTPTransport.Options);
  } else {
    // Use Gmail transporter if custom SMTP is not configured
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: MAIL_USERNAME,
        pass: MAIL_PASSWORD,
      },
    });
  }

  const mailOptions = {
    from: !SMTP_OPTIONS.IS_SMTP
      ? "Talawa<>noreply@gmail.com"
      : SMTP_OPTIONS.SMTP_USERNAME,
    to: mailFields.emailTo,
    subject: mailFields.subject,
    html: mailFields.body,
  };

  return new Promise((resolve, reject) => {
    // Send email using transporter
    transporter.sendMail(
      mailOptions,
      function (error: Error | null, info: SMTPTransport.SentMessageInfo) {
        if (error) {
          // Handle error if sending mail fails
          reject(ERROR_IN_SENDING_MAIL);
        } else {
          // Resolve with sent message information if email is sent successfully
          resolve(info);
        }
      },
    );
  });
};
