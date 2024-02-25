import fs from "fs";
import dotenv from "dotenv";
import { vi, describe, it, expect } from "vitest";
import { setNodeEnvironment } from "../../setup";
import * as getNodeEnvironment from "../../src/setup/getNodeEnvironment";

/*
  Test Case 1:
  Description: should set NODE_ENV to "production" and update .env_test file.
  Expected Behavior: When setNodeEnvironment function is called, it should set the NODE_ENV environment variable to "production" and update the .env_test file accordingly.

  Test Case 2:
  Description: should set NODE_ENV to "development" and update .env_test file.
  Expected Behavior: When setNodeEnvironment function is called, it should set the NODE_ENV environment variable to "development" and update the .env_test file accordingly.

  Note: Each test case involves mocking the getNodeEnvironment function to return a specific environment value, executing the setNodeEnvironment function, and asserting the expected behavior by checking the updated .env_test file.
*/
describe("Setup -> setNodeEnvironment", () => {
  it('should set NODE_ENV to "production" and update .env_test file', async () => {
    vi.spyOn(getNodeEnvironment, "getNodeEnvironment").mockImplementationOnce(
      () => Promise.resolve("production"),
    );
    await setNodeEnvironment();
    const env = dotenv.parse(fs.readFileSync(".env_test"));
    expect(env.NODE_ENV).toEqual("production");
  });

  it('should set NODE_ENV to "development" and update .env_test file', async () => {
    vi.spyOn(getNodeEnvironment, "getNodeEnvironment").mockImplementationOnce(
      () => Promise.resolve("development"),
    );
    await setNodeEnvironment();
    const env = dotenv.parse(fs.readFileSync(".env_test"));
    expect(env.NODE_ENV).toEqual("development");
  });
});
