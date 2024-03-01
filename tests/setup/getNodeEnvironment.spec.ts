import inquirer from "inquirer";
import { getNodeEnvironment } from "../../src/setup/getNodeEnvironment";
import { vi, describe, it, expect } from "vitest";
/*
  These tests ensure that the getNodeEnvironment function behaves correctly based on user input through inquirer.prompt.
  The function getNodeEnvironment() is expected to return the selected environment ('development' or 'production').
  Test 1:
  Description: should return "development" when user selects it
  - This test verifies that getNodeEnvironment() correctly returns 'development' when the user selects it through inquirer.prompt.
  - It spies on inquirer.prompt to mock its behavior, ensuring it resolves to {nodeEnv: 'development'}.
  - The function is then called, and its return value is compared against 'development'.
  - Additionally, it checks that inquirer.prompt was called with the expected parameters.
  Test 2:
  Description: should return "production" when user selects it
  - This test ensures that getNodeEnvironment() returns 'production' when the user selects it through inquirer.prompt.
  - Similar to Test 1, it mocks inquirer.prompt to resolve to {nodeEnv: 'production'}.
  - getNodeEnvironment() is called, and its return value is compared against 'production'.
  - It also verifies that inquirer.prompt was called with the expected parameters, ensuring consistency.
  These tests cover both possible user selections ('development' and 'production'), validating the behavior of getNodeEnvironment().
  They provide comprehensive testing of the function's functionality and ensure its reliability under different user inputs.
*/
describe("Setup -> getNodeEnvironment", () => {
  it('should return "development" when user selects it', async () => {
    vi.spyOn(inquirer, "prompt").mockImplementationOnce(() =>
      Promise.resolve({ nodeEnv: "development" }),
    );
    const result = await getNodeEnvironment();
    expect(result).toBe("development");
    expect(inquirer.prompt).toHaveBeenCalledWith([
      {
        type: "list",
        name: "nodeEnv",
        message: "Select Node environment:",
        choices: ["development", "production"],
        default: "development",
      },
    ]);
  });
  it('should return "production" when user selects it', async () => {
    vi.spyOn(inquirer, "prompt").mockImplementationOnce(() =>
      Promise.resolve({ nodeEnv: "production" }),
    );
    const result = await getNodeEnvironment();
    expect(result).toBe("production");
    expect(inquirer.prompt).toHaveBeenCalledWith([
      {
        type: "list",
        name: "nodeEnv",
        message: "Select Node environment:",
        choices: ["development", "production"],
        default: "development",
      },
    ]);
  });
});
