import { it, expect, vi, describe, beforeEach } from "vitest";
import inquirer from "inquirer";
import fs from "fs";
import { askForTransactionLogPath } from "../../setup";

/*
  Test Case 1:
  Description: function askForSuperAdminEmail should return email as entered.
  Expected Behavior: When the askForSuperAdminEmail function is called, it should prompt the user to enter an email address, and upon entering, it should return the entered email address.

  Test Case 2:
  Description: superAdmin prompts user, updates .env_test, and does not throw errors.
  Expected Behavior: When the superAdmin function is called, it should prompt the user to enter an email address for the last resort super admin, update the .env_test file with the entered email address, and it should not throw any errors during execution.

  Note: Each test case involves mocking user input using inquirer, executing the relevant function, and asserting the expected behavior by checking the returned email or the updated .env_test file.
*/
describe("Setup -> transactionLogPath", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return the transaction log path as entered by the user", async () => {
    const currDir = process.cwd();
    const testPath = `${currDir}/tests/setup/test-transaction.log`;
    vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({ logpath: testPath });
    vi.spyOn(fs, "existsSync").mockReturnValueOnce(true);
    vi.spyOn(fs, "accessSync").mockReturnValueOnce(undefined);

    const result = await askForTransactionLogPath();
    expect(result).toEqual(testPath);
  });

  it("should handle invalid path and prompt user again", async () => {
    const currDir = process.cwd();
    const testPath = `${currDir}/tests/setup/test-transaction.log`;
    vi.spyOn(inquirer, "prompt")
      .mockResolvedValueOnce({ logpath: "invalidpath" })
      .mockResolvedValueOnce({ logpath: testPath });
    vi.spyOn(fs, "existsSync")
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    vi.spyOn(fs, "accessSync").mockReturnValueOnce(undefined);
    const result = await askForTransactionLogPath();
    expect(result).toEqual(testPath);
  });
});
