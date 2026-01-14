import { expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { emailService } from "~/src/services/email/emailServiceInstance";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
    Mutation_sendVerificationEmail,
    Mutation_verifyEmail,
} from "../documentNodes";
import { mercuriusClient } from "../client";

suite("Mutation field verifyEmail", () => {
    test("should successfully verify email with valid token", async () => {
        const { authToken } = await createRegularUserUsingAdmin();

        // Spy on email provider and mock implementation to prevent actual sending
        const sendEmailSpy = vi.spyOn(emailService, "sendEmail").mockResolvedValue(undefined);

        // 1. Send verification email
        await mercuriusClient.mutate(Mutation_sendVerificationEmail, {
            headers: { authorization: `bearer ${authToken}` },
        });

        // 2. Extract token from email
        expect(sendEmailSpy).toHaveBeenCalled();
        const args = sendEmailSpy.mock.calls[0][0] as any;
        const emailContent = args.htmlBody || args.textBody;

        const match = emailContent?.match(/token=([a-zA-Z0-9_\-]+)/);
        expect(match).toBeDefined();
        const token = match![1];

        // 3. Verify Email
        const result = await mercuriusClient.mutate(Mutation_verifyEmail, {
            headers: { authorization: `bearer ${authToken}` },
            variables: { input: { token } },
        });

        expect(result.errors).toBeUndefined();
        assertToBeNonNullish(result.data?.verifyEmail);
        expect(result.data.verifyEmail.success).toBe(true);
        expect(result.data.verifyEmail.message).toBeDefined();

        sendEmailSpy.mockRestore();
    });

    test("should fail with invalid token", async () => {
        const { authToken } = await createRegularUserUsingAdmin();

        const result = await mercuriusClient.mutate(Mutation_verifyEmail, {
            headers: { authorization: `bearer ${authToken}` },
            variables: { input: { token: "invalid-token" } },
        });

        expect(result.errors).toBeDefined();
        expect(result.errors![0].extensions?.code).toBe("invalid_arguments");
    });
});
