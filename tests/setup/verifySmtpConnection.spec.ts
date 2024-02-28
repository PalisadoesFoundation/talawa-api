import { expect, it, describe, vi } from "vitest";
import { verifySmtpConnection } from "../../src/setup/verifySmtpConnection";
import type { Transporter } from "nodemailer";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

/*
  Test Suite: verifySmtpConnection

  Description:
  This test suite verifies the behavior of the verifySmtpConnection function, which is responsible for verifying the SMTP connection using nodemailer.

  Test Case 1:
  Description: should return success and log message on successful connection
  Expected Behavior: When verifySmtpConnection function is called with valid SMTP configuration, it should create a nodemailer transport, attempt to verify the SMTP connection, and return success along with a null error indicating a successful connection.

  Test Case 2:
  Description: should return failure and log error on failed connection
  Expected Behavior: When verifySmtpConnection function is called with invalid SMTP configuration or a failed connection, it should create a nodemailer transport, attempt to verify the SMTP connection, encounter a failure, and return failure along with an error message indicating the failed connection.

  Note: Each test case involves mocking the nodemailer createTransport method to simulate successful or failed connection verification, executing the verifySmtpConnection function, and asserting the expected behavior by checking the returned success flag and error message.
*/
describe("Setup -> verifySmtpConnection", () => {
  it("should return success and log message on successful connection", async () => {
    const mockConfig = {
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "587",
      SMTP_SSL_TLS: "true",
      SMTP_USERNAME: "username",
      SMTP_PASSWORD: "password",
    };

    vi.spyOn(nodemailer, "createTransport").mockReturnValueOnce({
      verify: vi.fn().mockResolvedValueOnce(true),
      close: vi.fn(),
    } as unknown as Transporter<SMTPTransport.SentMessageInfo>);

    const result = await verifySmtpConnection(mockConfig);
    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
  });

  it("should return failure and log error on failed connection", async () => {
    const mockConfig = {
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "587",
      SMTP_SSL_TLS: "true",
      SMTP_USERNAME: "username",
      SMTP_PASSWORD: "password",
    };

    vi.spyOn(nodemailer, "createTransport").mockReturnValueOnce({
      verify: vi.fn().mockRejectedValueOnce(new Error("Connection failed")),
      close: vi.fn(),
    } as unknown as Transporter<SMTPTransport.SentMessageInfo>);

    const result = await verifySmtpConnection(mockConfig);

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
  });
});
