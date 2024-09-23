import { it, expect, describe } from "vitest";
import dotenv from "dotenv";
import { accessAndRefreshTokens } from "../../setup";
import fs from "fs";

/*
  This test file aims to validate the behavior of the accessAndRefreshTokens function, 
  which is responsible for generating and updating access token and refresh token secrets 
  stored in a .env_test file.

  Test Suite Structure:
  - The test suite consists of three test cases, each targeting a specific aspect of the function's behavior.
  - The test cases are organized within a describe block named 'accessAndRefreshTokens'.

  Test Case 1: 'generates and updates access token secret if null'
  - Purpose: Ensure that the function correctly generates and updates the access token secret 
    in the .env_test file if it is initially null.
  - Steps:
    1. Read the initial .env_test file content and store the existing access token secret.
    2. Call the function with a null access token secret.
    3. Read the updated .env_test file content and compare the new access token secret with the existing one.

  Test Case 2: 'generates and updates refresh token secret if null'
  - Purpose: Validate that the function properly generates and updates the refresh token secret 
    in the .env_test file if it is initially null.
  - Steps:
    1. Read the initial .env_test file content and store the existing refresh token secret.
    2. Call the function with a null refresh token secret.
    3. Read the updated .env_test file content and compare the new refresh token secret with the existing one.

  Test Case 3: 'does not update existing secrets'
  - Purpose: Confirm that the function does not update existing secrets in the .env_test file if they are provided.
  - Steps:
    1. Read the initial .env_test file content and store the existing access and refresh token secrets.
    2. Call the function with existing access and refresh token secrets.
    3. Read the updated .env_test file content and compare the new access and refresh token secrets 
       with the existing ones.

  Additional Considerations:
  - Each test case follows the Arrange-Act-Assert pattern.
  - Environment variables are read from the .env_test file to isolate test environment from the production environment.
  - The 'toEqual' matcher is used to compare objects' equality.
  - The 'not.toEqual' matcher is used to verify that new secrets are generated and updated.

  Overall, this test suite ensures that the accessAndRefreshTokens function behaves as expected, 
  generating and updating token secrets as needed while preserving existing secrets when provided.
*/

describe("Setup -> accessAndRefreshTokens", () => {
  it("generates and updates access token secret if null", async () => {
    const env = dotenv.parse(fs.readFileSync(".env_test"));
    const EXISTING_ACCESS_TOKEN = env.ACCESS_TOKEN_SECRET;

    await accessAndRefreshTokens(null, "REFRESH_TOKEN");

    const envNew = dotenv.parse(fs.readFileSync(".env_test"));
    const NEW_ACCESS_TOKEN = envNew.ACCESS_TOKEN_SECRET;

    expect(EXISTING_ACCESS_TOKEN).not.toEqual(NEW_ACCESS_TOKEN);
  });

  it("generates and updates refresh token secret if null", async () => {
    const env = dotenv.parse(fs.readFileSync(".env_test"));
    const EXISTING_REFRESH_TOKEN = env.REFRESH_TOKEN_SECRET;

    await accessAndRefreshTokens("ACCESS_TOKEN", null);

    const envNew = dotenv.parse(fs.readFileSync(".env_test"));
    const NEW_REFRESH_TOKEN = envNew.REFRESH_TOKEN_SECRET;

    expect(EXISTING_REFRESH_TOKEN).not.toEqual(NEW_REFRESH_TOKEN);
  });

  it("does not update existing secrets", async () => {
    const env = dotenv.parse(fs.readFileSync(".env_test"));
    const EXISTING_ACCESS_TOKEN = env.ACCESS_TOKEN_SECRET;
    const EXISTING_REFRESH_TOKEN = env.REFRESH_TOKEN_SECRET;

    await accessAndRefreshTokens("ACCESS_TOKEN", "REFRESH_TOKEN");

    const envNew = dotenv.parse(fs.readFileSync(".env_test"));
    const NEW_ACCESS_TOKEN = envNew.ACCESS_TOKEN_SECRET;
    const NEW_REFRESH_TOKEN = envNew.REFRESH_TOKEN_SECRET;

    expect(EXISTING_ACCESS_TOKEN).toEqual(NEW_ACCESS_TOKEN);
    expect(EXISTING_REFRESH_TOKEN).toEqual(NEW_REFRESH_TOKEN);
  });
});
