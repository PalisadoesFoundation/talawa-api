import { it, describe, vi, expect } from "vitest";
import inquirer from "inquirer";
import * as isValidEmail from "../../src/setup/isValidEmail";
import dotenv from "dotenv";
import fs from "fs";
import { twoFactorAuth } from "../../setup";

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
