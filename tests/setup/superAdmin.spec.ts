import { it, expect, vi, describe, beforeEach } from "vitest";
import inquirer from "inquirer";
import fs from "fs";
import dotenv from "dotenv";
import * as askForSuperAdminEmail from "../../src/setup/superAdmin";
import { superAdmin } from "../../setup";

/*
  Test Case 1:
  Description: function askForSuperAdminEmail should return email as entered.
  Expected Behavior: When the askForSuperAdminEmail function is called, it should prompt the user to enter an email address, and upon entering, it should return the entered email address.

  Test Case 2:
  Description: superAdmin prompts user, updates .env_test, and does not throw errors.
  Expected Behavior: When the superAdmin function is called, it should prompt the user to enter an email address for the last resort super admin, update the .env_test file with the entered email address, and it should not throw any errors during execution.

  Note: Each test case involves mocking user input using inquirer, executing the relevant function, and asserting the expected behavior by checking the returned email or the updated .env_test file.
*/
describe("Setup -> superAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should validate the email and return an error message for invalid email", async () => {
    const invalidEmail = "invalid-email";

    vi.spyOn(inquirer, "prompt").mockImplementationOnce((questions: any) => {
      // Assuming questions is an array
      const questionArray = Array.isArray(questions) ? questions : [questions];
      const question = questionArray.find((q: any) => q.name === "email");
      const validate = question?.validate;

      if (typeof validate === "function") {
        const validationResult = validate(invalidEmail);
        return Promise.resolve({
          email: validationResult === true ? invalidEmail : validationResult,
        });
      }

      return Promise.resolve({ email: invalidEmail });
    });

    const result = await askForSuperAdminEmail.askForSuperAdminEmail();
    expect(result).toEqual("Invalid email. Please try again.");
  });

  it("function askForSuperAdminEmail should return email as entered", async () => {
    const testEmail = "testemail@test.com";
    vi.spyOn(inquirer, "prompt").mockImplementationOnce(() =>
      Promise.resolve({
        email: testEmail,
      }),
    );
    const result = await askForSuperAdminEmail.askForSuperAdminEmail();
    expect(result).toEqual(testEmail);
  });

  it("superAdmin prompts user, updates .env_test, and does not throw errors", async () => {
    const email = "testemail@test.com";
    vi.spyOn(
      askForSuperAdminEmail,
      "askForSuperAdminEmail",
    ).mockImplementationOnce(() => Promise.resolve(email));

    await superAdmin();

    const env = dotenv.parse(fs.readFileSync(".env_test"));
    expect(env.LAST_RESORT_SUPERADMIN_EMAIL).toEqual(email);
  });
});
