import { it, expect, vi, describe, beforeEach } from "vitest";
import fs from "fs";
import dotenv from "dotenv";
import { setImageUploadSize, validateImageFileSize } from "../../src/setup/setImageUploadSize";
import { MAXIMUM_IMAGE_SIZE_LIMIT_KB } from "../../src/constants";

describe("Setup -> setImageUploadSize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('setImageUploadSize updates .env_test for test environment with correct size.', async () => {
    const size = 1300;
    await setImageUploadSize(size);

    const env = dotenv.parse(fs.readFileSync('.env_test'));
    expect(env.IMAGE_SIZE_LIMIT_KB).toEqual(size.toString())
  });

  it('setImageUploadSize truncates size if exceeding limit', async () => {
    const size = 2000000;
    await setImageUploadSize(size);

    const env = dotenv.parse(fs.readFileSync('.env_test'));
    expect(env.IMAGE_SIZE_LIMIT_KB).toEqual(MAXIMUM_IMAGE_SIZE_LIMIT_KB.toString())
  })

  it('function validateImageFileSize returns true for size in range.', async () => {
    const size = 13000;
    const result = validateImageFileSize(size);
    expect(result).toEqual(true);
  })

  it('function validateImageFileSize returns false for size exceeding range.', async () => {
    const size = -1000;
    const result = validateImageFileSize(size);
    expect(result).toEqual(false);
  })
})
