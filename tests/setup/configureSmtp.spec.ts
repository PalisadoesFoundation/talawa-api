import { it, expect, vi, describe } from "vitest";
import inquirer from "inquirer";
import * as verifySmtpConnection from "../../src/setup/verifySmtpConnection";
import { configureSmtp } from "../../setup";
import dotenv from "dotenv";
import fs from "fs";

/*
  Test Case 1:
  Description: should configure SMTP and update .env_test if valid data is provided.
  Expected Behavior: When the configureSmtp function is called with valid SMTP configuration data, it should prompt the user to provide SMTP configuration details, verify the SMTP connection, update the .env_test file with the provided SMTP configuration, and ensure that the .env_test file is updated correctly with the provided data.

  Test Case 2:
  Description: should not update .env_test and display error if invalid data is provided.
  Expected Behavior: When the configureSmtp function is called with invalid SMTP configuration data, it should prompt the user to provide SMTP configuration details, attempt to verify the SMTP connection, display an error message indicating the failure, and ensure that the .env_test file is not updated with the invalid data.

  Test Case 3:
  Description: should not update .env and display error if verification fails.
  Expected Behavior: When the configureSmtp function is called with valid SMTP configuration data but the verification of the SMTP connection fails, it should prompt the user to provide SMTP configuration details, attempt to verify the SMTP connection, display an error message indicating the failure, and ensure that the .env_test file is not updated.
  
  Note: Each test case involves mocking user input using inquirer, mocking the verifySmtpConnection function to simulate successful or failed connection verification, executing the configureSmtp function, and asserting the expected behavior by checking the updated .env_test file or the displayed error messages.
*/
describe("Setup -> configureSmtp", () => {
  it("should configure SMTP and update .env_test if valid data is provided", async () => {
    const validData = {
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "587",
      SMTP_USERNAME: "username",
      SMTP_PASSWORD: "password",
      SMTP_SSL_TLS: true,
    };

    vi.spyOn(inquirer, "prompt").mockResolvedValueOnce(validData);
    vi.spyOn(verifySmtpConnection, "verifySmtpConnection").mockReturnValue(
      Promise.resolve({
        success: true,
        error: null,
      }),
    );

    await configureSmtp();

    const env = dotenv.parse(fs.readFileSync(".env_test"));
    expect(env.SMTP_HOST).toEqual(validData.SMTP_HOST);
    expect(env.SMTP_PASSWORD).toEqual(validData.SMTP_PASSWORD);
    expect(env.SMTP_PORT).toEqual(validData.SMTP_PORT);
    expect(env.SMTP_USERNAME).toEqual(validData.SMTP_USERNAME);
    expect(env.SMTP_SSL_TLS).toEqual(validData.SMTP_SSL_TLS.toString());
  });

  it("should not update .env_test and display error if invalid data is provided", async () => {
    const invalidData = {
      SMTP_HOST: "",
      SMTP_PORT: "589",
      SMTP_USERNAME: "username_invalid",
      SMTP_PASSWORD: "password_invalid",
      SMTP_SSL_TLS: false,
    };

    vi.spyOn(inquirer, "prompt").mockResolvedValueOnce(invalidData);
    vi.spyOn(verifySmtpConnection, "verifySmtpConnection").mockReturnValue(
      Promise.resolve({
        success: false,
        error: new Error("Connection failed"),
      }),
    );
    const cosoleErrorSpy = vi.spyOn(console, "error");
    await configureSmtp();

    expect(cosoleErrorSpy).toHaveBeenCalledWith(
      "Invalid SMTP configuration. Please provide all required parameters.",
    );
    const env = dotenv.parse(fs.readFileSync(".env_test"));
    expect(env.SMTP_HOST).not.toEqual(invalidData.SMTP_HOST);
    expect(env.SMTP_PASSWORD).not.toEqual(invalidData.SMTP_PASSWORD);
    expect(env.SMTP_PORT).not.toEqual(invalidData.SMTP_PORT);
    expect(env.SMTP_USERNAME).not.toEqual(invalidData.SMTP_USERNAME);
    expect(env.SMTP_SSL_TLS).not.toEqual(invalidData.SMTP_SSL_TLS.toString());
  });

  it("should not update .env_test and display error if verification fails", async () => {
    const validData = {
      SMTP_HOST: "smtp.example.com",
      SMTP_PORT: "587",
      SMTP_USERNAME: "username",
      SMTP_PASSWORD: "password",
      SMTP_SSL_TLS: true,
    };

    vi.spyOn(inquirer, "prompt").mockResolvedValueOnce(validData);
    vi.spyOn(verifySmtpConnection, "verifySmtpConnection").mockReturnValue(
      Promise.resolve({
        success: false,
        error: new Error("Connection failed"),
      }),
    );
    const consoleErrorSpy = vi.spyOn(console, "error");
    const consoleLogSpy = vi.spyOn(console, "log");

    await configureSmtp();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "SMTP configuration verification failed. Please check your SMTP settings.",
    );
    expect(consoleLogSpy).toHaveBeenCalledWith("Connection failed");
  });
});
