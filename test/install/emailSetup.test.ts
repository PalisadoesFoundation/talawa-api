import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { emailSetup } from '../../scripts/setup/emailSetup';
import * as promptHelpers from '../../scripts/setup/promptHelpers';

// Local mock interface to avoid importing from setup.ts (which has side effects)
interface SetupAnswers {
    [key: string]: any;
}

// Mock the prompt helpers
vi.mock('../../scripts/setup/promptHelpers', () => ({
    promptConfirm: vi.fn(),
    promptInput: vi.fn(),
    promptList: vi.fn(),
}));

describe('emailSetup', () => {
    let answers: SetupAnswers;

    beforeEach(() => {
        answers = {};
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should skip email configuration if user declines', async () => {
        vi.mocked(promptHelpers.promptConfirm).mockResolvedValueOnce(false);

        const result = await emailSetup(answers);

        expect(promptHelpers.promptConfirm).toHaveBeenCalledWith(
            'configureEmail',
            expect.stringContaining('Do you want to configure email'),
            true
        );
        expect(promptHelpers.promptList).not.toHaveBeenCalled();
        expect(result).toEqual(answers);
    });

    it('should configure SES when selected', async () => {
        vi.mocked(promptHelpers.promptConfirm).mockResolvedValueOnce(true); // Configure email? Yes
        vi.mocked(promptHelpers.promptList).mockResolvedValueOnce('ses'); // Provider: SES

        // SES Prompts
        vi.mocked(promptHelpers.promptInput)
            .mockResolvedValueOnce('us-east-1') // Region
            .mockResolvedValueOnce('access-key') // Access Key
            .mockResolvedValueOnce('secret-key') // Secret Key
            .mockResolvedValueOnce('test@example.com') // From Email
            .mockResolvedValueOnce('Test App'); // From Name

        const result = await emailSetup(answers);

        expect(result.EMAIL_PROVIDER).toBe('ses');
        expect(result.AWS_SES_REGION).toBe('us-east-1');
        expect(result.AWS_ACCESS_KEY_ID).toBe('access-key');
        expect(result.AWS_SECRET_ACCESS_KEY).toBe('secret-key');
        expect(result.AWS_SES_FROM_EMAIL).toBe('test@example.com');
        expect(result.AWS_SES_FROM_NAME).toBe('Test App');

        expect(promptHelpers.promptList).toHaveBeenCalledWith(
            'EMAIL_PROVIDER',
            'Select email provider:',
            ['ses'],
            'ses'
        );

        // Verify Test Email Prompt
        expect(promptHelpers.promptConfirm).toHaveBeenCalledWith(
            "sendTestEmail",
            expect.stringContaining("Do you want to send a test email now?"),
            false,
        );
    });

    it('should propagate errors', async () => {
        const error = new Error('Prompt failed');
        vi.mocked(promptHelpers.promptConfirm).mockRejectedValueOnce(error);

        await expect(emailSetup(answers)).rejects.toThrow('Prompt failed');
    });
});
