import { it, expect, vi, describe, beforeEach } from 'vitest';
import inquirer from 'inquirer';
import * as askToKeepValues from '../../src/setup/askToKeepValues'
import fs from 'fs';
import dotenv from 'dotenv';
import { recaptchaSiteKey } from '../../setup';

describe('Setup -> recaptchaSiteKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update .env_test with site key if user chooses to keep details', async () => {
    const mockSiteKey = 'valid-site-key-test';
    vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({ recaptchaSecretKey: mockSiteKey });
    vi.spyOn(askToKeepValues, "askToKeepValues").mockImplementationOnce(() => Promise.resolve(true));

    await recaptchaSiteKey();

    expect(inquirer.prompt).toHaveBeenCalledWith([
      {
        type: 'input',
        name: 'recaptchaSiteKeyInp',
        message: 'Enter your reCAPTCHA site key:',
        validate: expect.any(Function),
      },
    ]);
  });

  it('should not update .env_test if user chooses not to keep details, after entering.', async () => {
    const mockSiteKey = 'valid-site-key-test-notKeep';
    vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({ recaptchaSecretKey: mockSiteKey });
    vi.spyOn(askToKeepValues, "askToKeepValues").mockImplementationOnce(() => Promise.resolve(false));

    await recaptchaSiteKey();

    const env = dotenv.parse(fs.readFileSync('.env_test'));
    expect(env.RECAPTCHA_SITE_KEY).not.toEqual(mockSiteKey);
  });
});
