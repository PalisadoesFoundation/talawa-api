import { it, describe, vi, expect } from "vitest";
import inquirer from "inquirer";
import * as isValidEmail from "../../src/setup/isValidEmail";
import dotenv from "dotenv";
import fs from "fs";
import { twoFactorAuth } from "../../setup";

/*
  Test Case 1:
  Description: validating email format using isValidEmail.
  Expected Behavior: When the isValidEmail function is called with a valid email format, it should return true indicating that the email format is valid.

  Test Case 2:
  Description: validating email format using isValidEmail should throw false for invalid format.
  Expected Behavior: When the isValidEmail function is called with an invalid email format, it should return false indicating that the email format is invalid.

  Test Case 3:
  Description: Should Update the .env_test file, if valid email with a password is provided.
  Expected Behavior: When the twoFactorAuth function is called, it should prompt the user to enter a valid email and password for two-factor authentication, update the .env_test file with the provided email and password, and ensure that the email and password are correctly written in the .env_test file.

  Note: Each test case involves validating the email format using the isValidEmail function, executing the twoFactorAuth function, and asserting the expected behavior by checking the validity of the email format and the updated .env_test file.
*/
describe("Setup -> twoFactorAuth", () => {
  it("validating email format using isValidEmail", async () => {
    const validEmail = "testemail@testing.com";
    const result = isValidEmail.isValidEmail(validEmail);
    expect(result).toEqual(true);
  });

  it("validating email format using isValidEmail should throw false for invalid format.", async () => {
    const invalidEmail = "testemailtesting.com";
    const result = isValidEmail.isValidEmail(invalidEmail);
    expect(result).toEqual(false);
  });

  it("Should Update the .env_test file, if valid email with a password is provided", async () => {
    const validEmail = "testemail@testing.com";
    const validPassword = "testPassword";
    vi.spyOn(inquirer, "prompt").mockImplementationOnce(() =>
      Promise.resolve({
        email: validEmail,
        password: validPassword,
      }),
    );

    await twoFactorAuth();

    const env = dotenv.parse(fs.readFileSync(".env_test"));
    expect(env.MAIL_USERNAME).toEqual(validEmail);
    expect(env.MAIL_PASSWORD).toEqual(validPassword);
  });
});
