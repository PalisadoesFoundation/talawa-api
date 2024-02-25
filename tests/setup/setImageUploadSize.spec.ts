import { it, expect, vi, describe, beforeEach } from "vitest";
import fs from "fs";
import dotenv from "dotenv";
import {
  setImageUploadSize,
  validateImageFileSize,
} from "../../src/setup/setImageUploadSize";
import { MAXIMUM_IMAGE_SIZE_LIMIT_KB } from "../../src/constants";

/*
  Test Case 1:
  Description: setImageUploadSize updates .env_test for the test environment with the correct size.
  Expected Behavior: When setImageUploadSize function is called with a size value, it should update the .env_test file with the provided size in kilobytes.

  Test Case 2:
  Description: setImageUploadSize truncates size if exceeding the maximum limit.
  Expected Behavior: When setImageUploadSize function is called with a size value exceeding the maximum limit, it should truncate the size to the maximum limit defined by MAXIMUM_IMAGE_SIZE_LIMIT_KB constant and update the .env_test file accordingly.

  Test Case 3:
  Description: The validateImageFileSize function returns true for a size within the valid range.
  Expected Behavior: When validateImageFileSize function is called with a size value within the valid range, it should return true indicating that the size is valid.

  Test Case 4:
  Description: The validateImageFileSize function returns false for a size exceeding the valid range.
  Expected Behavior: When validateImageFileSize function is called with a size value exceeding the valid range, it should return false indicating that the size is not valid.

  Note: Each test case involves setting up the necessary environment, executing the functions, and asserting the expected behavior.
*/
describe("Setup -> setImageUploadSize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("setImageUploadSize updates .env_test for test environment with correct size.", async () => {
    const size = 1300;
    await setImageUploadSize(size);

    const env = dotenv.parse(fs.readFileSync(".env_test"));
    expect(env.IMAGE_SIZE_LIMIT_KB).toEqual(size.toString());
  });

  it("setImageUploadSize truncates size if exceeding limit", async () => {
    const size = 2000000;
    await setImageUploadSize(size);

    const env = dotenv.parse(fs.readFileSync(".env_test"));
    expect(env.IMAGE_SIZE_LIMIT_KB).toEqual(
      MAXIMUM_IMAGE_SIZE_LIMIT_KB.toString(),
    );
  });

  it("function validateImageFileSize returns true for size in range.", async () => {
    const size = 13000;
    const result = validateImageFileSize(size);
    expect(result).toEqual(true);
  });

  it("function validateImageFileSize returns false for size exceeding range.", async () => {
    const size = -1000;
    const result = validateImageFileSize(size);
    expect(result).toEqual(false);
  });
});
