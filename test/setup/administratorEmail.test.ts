import { describe, it, vi, expect, afterEach } from "vitest";
import { administratorEmail } from "setup";
import inquirer from "inquirer";

vi.mock("inquirer");

describe("Setup -> askForAdministratorEmail", () => {
  const originalEmail = process.env.API_ADMINISTRATOR_USER_EMAIL_ADDRESS;

  afterEach(() => {
    process.env.API_ADMINISTRATOR_USER_EMAIL_ADDRESS = originalEmail;
  });

  it("should prompt the user for an email and update the email env", async () => {
    const mockedEmail = "testuser@email.com";

    vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({ email: mockedEmail });

    await administratorEmail();
    
    expect(process.env.API_ADMINISTRATOR_USER_EMAIL_ADDRESS).toBe(mockedEmail);
  });
});
