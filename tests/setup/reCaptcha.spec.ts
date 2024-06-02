import { it, expect, vi, describe, beforeEach } from "vitest";
import inquirer from "inquirer";
import * as askToKeepValues from "../../src/setup/askToKeepValues";
import fs from "fs";
import dotenv from "dotenv";
import { recaptcha } from "../../setup";
import { validateRecaptcha } from "../../src/setup/reCaptcha";

/*
  Test Suite: Setup -> recaptcha

  Description:
  This test suite verifies the functionality of the recaptcha setup process, which is responsible for updating the application's configuration related to reCAPTCHA.

  Before each test, all mocks are cleared to ensure a clean state for each test case execution.

  Test Case 1:
  Description: It should update .env_test with the secret key if the user chooses to keep details.
  Expected Behavior: When the user provides a reCAPTCHA secret key and chooses to keep the details, the function should update the .env_test file with the provided secret key.

  Test Case 2:
  Description: It should not update .env_test if the user chooses not to keep details after entering the secret key.
  Expected Behavior: When the user provides a reCAPTCHA secret key but chooses not to keep the details, the function should not update the .env_test file with the provided secret key.

  Note: Each test case involves mocking user input using inquirer, mocking the askToKeepValues function, and asserting the expected behavior of the recaptcha setup function.
*/
describe("Setup -> recaptcha", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update .env_test with secret key if user chooses to keep details", async () => {
    const mockSecret = "valid-secret-key-test";
    vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
      recaptchaSecretKey: mockSecret,
    });
    vi.spyOn(askToKeepValues, "askToKeepValues").mockImplementationOnce(() =>
      Promise.resolve(true),
    );

    await recaptcha();

    const env = dotenv.parse(fs.readFileSync(".env_test"));
    expect(inquirer.prompt).toHaveBeenCalledWith([
      {
        type: "input",
        name: "recaptchaSecretKey",
        message: "Enter your reCAPTCHA secret key:",
        validate: expect.any(Function),
      },
    ]);
    expect(env.RECAPTCHA_SECRET_KEY).toEqual(mockSecret);
  });

  it("should not update .env_test if user chooses not to keep details, after entering.", async () => {
    const mockSecret = "valid-secret-key-test-notKeep";
    vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
      recaptchaSecretKey: mockSecret,
    });
    vi.spyOn(askToKeepValues, "askToKeepValues").mockImplementationOnce(() =>
      Promise.resolve(false),
    );

    await recaptcha();

    const env = dotenv.parse(fs.readFileSync(".env_test"));
    expect(env.RECAPTCHA_SECRET_KEY).not.toEqual(mockSecret);
  });

  it("should return false for a inValid reCaptcha token", async () => {
    const inValidToken = "0p9j8asd56fgh7jkl98mnbvcxz123qwe4rt5y6ui54321";
    const result = validateRecaptcha(inValidToken);
    expect(result).toEqual(false);
  });
});
