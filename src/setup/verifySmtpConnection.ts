import nodemailer from "nodemailer";

type VerifySmtpConnectionReturnType = {
  success: boolean;
  error: unknown;
};

/**
 * The function `verifySmtpConnection` verifies the SMTP connection using the provided configuration
 * and returns a success status and error message if applicable.
 * @param config - The `config` parameter is an object that contains the configuration settings for the
 * SMTP connection. It should have the following properties:
 * @returns The function `verifySmtpConnection` returns a Promise that resolves to an object of type
 * `VerifySmtpConnectionReturnType`. The `VerifySmtpConnectionReturnType` object has two properties:
 * `success` and `error`. If the SMTP connection is verified successfully, the `success` property will
 * be `true` and the `error` property will be `null`. If the SMTP connection verification fails
 */
export async function verifySmtpConnection(
  config: Record<string, string>,
): Promise<VerifySmtpConnectionReturnType> {
  const transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: Number(config.SMTP_PORT),
    secure: config.SMTP_SSL_TLS === "true",
    auth: {
      user: config.SMTP_USERNAME,
      pass: config.SMTP_PASSWORD,
    },
  });

  try {
    await transporter.verify();
    console.log("SMTP connection verified successfully.");
    return { success: true, error: null };
  } catch (error: unknown) {
    console.error("SMTP connection verification failed:");
    return { success: false, error };
  } finally {
    transporter.close();
  }
}
