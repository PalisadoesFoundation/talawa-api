import { expect, suite, test, vi } from "vitest";
import { emailService } from "~/src/services/email/emailServiceInstance";
import { assertToBeNonNullish } from "../../../helpers";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_sendVerificationEmail,
	Mutation_verifyEmail,
} from "../documentNodes";

suite("Mutation field verifyEmail", () => {
	test("should successfully verify email with valid token", async () => {
		const { authToken } = await createRegularUserUsingAdmin();

		// Spy on email provider and mock implementation to prevent actual sending
		const sendEmailSpy = vi.spyOn(emailService, "sendEmail").mockResolvedValue({
			id: "mock-id",
			success: true,
			messageId: "mock-message-id",
		});

		// 1. Send verification email
		await mercuriusClient.mutate(Mutation_sendVerificationEmail, {
			headers: { authorization: `bearer ${authToken}` },
		});

		// 2. Extract token from email
		expect(sendEmailSpy).toHaveBeenCalled();
		const calls = sendEmailSpy.mock.calls;
		// Ensure we have at least one call
		expect(calls.length).toBeGreaterThan(0);
		const firstCall = calls[0];
		assertToBeNonNullish(firstCall);

		const args = firstCall[0] as
			| {
					htmlBody?: string;
					textBody?: string;
			  }
			| undefined;

		assertToBeNonNullish(args);

		const emailContent = args.htmlBody || args.textBody;

		const match = emailContent?.match(/token=([a-zA-Z0-9_-]+)/);
		expect(match).toBeDefined();
		assertToBeNonNullish(match);
		const token = match[1];
		assertToBeNonNullish(token);

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
		const errors = result.errors;
		assertToBeNonNullish(errors);
		const error = errors[0];
		assertToBeNonNullish(error);
		expect(error.extensions?.code).toBe("invalid_arguments");
	});
});
