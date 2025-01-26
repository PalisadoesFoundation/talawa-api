import { describe, it, vi, expect, afterEach } from "vitest";
import { setNodeEnvironment } from "setup";
import inquirer from "inquirer";

vi.mock("inquirer");

describe("Setup -> setNodeEnvironment", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    vi.resetAllMocks();
  });

  it("should prompt the user for NODE_ENV when NODE_ENV is 'test'", async () => {
    const mockedNodeEnv = "production";
    vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({ nodeEnv: mockedNodeEnv });
    process.env.NODE_ENV = "test";

    await setNodeEnvironment();

    expect(process.env.NODE_ENV).toBe(mockedNodeEnv);
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

  it("should set NODE_ENV to 'development' by default when NODE_ENV is 'test' and no selection is made", async () => {
    vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({ nodeEnv: "development" }); // Mock inquirer prompt with default

    process.env.NODE_ENV = "test";

    await setNodeEnvironment();

    expect(process.env.NODE_ENV).toBe("development");
    expect(inquirer.prompt).toHaveBeenCalled();
  });

  it("should handle errors thrown by inquirer.prompt when NODE_ENV is 'test'", async () => {
    const mockedError = new Error("Prompt failed");
    vi.spyOn(inquirer, "prompt").mockRejectedValueOnce(mockedError); // Mock inquirer to throw an error

    process.env.NODE_ENV = "test";

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(setNodeEnvironment()).rejects.toThrow();

    expect(consoleErrorSpy).toHaveBeenCalledWith(mockedError);

    consoleErrorSpy.mockRestore();
  });

  it("should leave NODE_ENV unchanged when not in 'test' environment", async () => {
    process.env.NODE_ENV = "development";

    await setNodeEnvironment();

    expect(process.env.NODE_ENV).toBe("development");
    expect(inquirer.prompt).not.toHaveBeenCalled();
  });
});
