import { it, expect, vi, describe, beforeEach } from "vitest";
import inquirer from "inquirer";
import * as askToKeepValues from "../../src/setup/askToKeepValues";
import fs from "fs";
import dotenv from "dotenv";
import { recaptcha } from "../../setup";

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
});
