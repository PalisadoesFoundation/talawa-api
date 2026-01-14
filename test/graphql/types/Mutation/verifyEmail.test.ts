import { afterEach, beforeEach, expect, suite, test, vi } from "vitest";
import { emailService } from "~/src/services/email/emailServiceInstance";
import { assertToBeNonNullish } from "../../../helpers";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_sendVerificationEmail,
	Mutation_verifyEmail,
} from "../documentNodes";

suite("Mutation field verifyEmail", () => {
	// biome-ignore lint/suspicious/noExplicitAny: generic spy type
	let sendEmailSpy: any;

	beforeEach(async () => {
		// Spy on email provider BEFORE any user creation to catch welcome emails
		sendEmailSpy = vi.spyOn(emailService, "sendEmail").mockResolvedValue({
			id: "mock-id",
			success: true,
			messageId: "mock-message-id",
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("should successfully verify email with valid token", async () => {
		const { authToken } = await createRegularUserUsingAdmin();

		// Clear the welcome email call so we can focus on verification email
		sendEmailSpy.mockClear();

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
	});

	test("should fail with invalid token", async () => {
		const { authToken, userId } = await createRegularUserUsingAdmin();

		// Manually ensure user is NOT verified (idempotency override)
		const { eq } = await import("drizzle-orm");
		const { usersTable } = await import("~/src/drizzle/tables/users");
		const { server } = await import("../../../../test/server");

		await server.drizzleClient
			.update(usersTable)
			.set({ isEmailAddressVerified: false })
			.where(eq(usersTable.id, userId));

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

	test("should fail with expired token", async () => {
		const { authToken, userId } = await createRegularUserUsingAdmin();

		const { eq } = await import("drizzle-orm");
		const { server } = await import("../../../../test/server");

		// Clear previous calls (welcome email)
		sendEmailSpy.mockClear();

		// 1. Send verification email
		await mercuriusClient.mutate(Mutation_sendVerificationEmail, {
			headers: { authorization: `bearer ${authToken}` },
		});

		const calls = sendEmailSpy.mock.calls;
		expect(calls.length).toBeGreaterThan(0);
		const args = calls[0][0] as { htmlBody?: string; textBody?: string };
		const emailContent = args.htmlBody || args.textBody;
		const match = emailContent?.match(/token=([a-zA-Z0-9_-]+)/);
		const token = match?.[1];
		assertToBeNonNullish(token);

		// 2. EXPIRE the token in DB
		const { emailVerificationTokensTable } = await import(
			"~/src/drizzle/tables/emailVerificationTokens"
		);

		// Set expiresAt to 25 hours ago (or just 1 second ago)
		const expiredDate = new Date(Date.now() - 10000);

		await server.drizzleClient
			.update(emailVerificationTokensTable)
			.set({ expiresAt: expiredDate })
			.where(eq(emailVerificationTokensTable.userId, userId));

		// Manually ensure user is NOT verified (idempotency override)
		const { usersTable } = await import("~/src/drizzle/tables/users");
		await server.drizzleClient
			.update(usersTable)
			.set({ isEmailAddressVerified: false })
			.where(eq(usersTable.id, userId));

		// 3. Attempt to verify
		const result = await mercuriusClient.mutate(Mutation_verifyEmail, {
			headers: { authorization: `bearer ${authToken}` },
			variables: { input: { token } },
		});

		expect(result.errors).toBeDefined();
		assertToBeNonNullish(result.errors);
		expect(result.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
	});

	test("should fail with already used verify token (replay attack)", async () => {
		const { authToken, userId } = await createRegularUserUsingAdmin();

		sendEmailSpy.mockClear();

		// 1. Send verification email
		await mercuriusClient.mutate(Mutation_sendVerificationEmail, {
			headers: { authorization: `bearer ${authToken}` },
		});

		const calls = sendEmailSpy.mock.calls;
		const args = calls[0][0] as { htmlBody?: string; textBody?: string };
		const emailContent = args.htmlBody || args.textBody;
		const match = emailContent?.match(/token=([a-zA-Z0-9_-]+)/);
		const token = match?.[1];
		assertToBeNonNullish(token);

		// 2. First Verification (Success)
		const result1 = await mercuriusClient.mutate(Mutation_verifyEmail, {
			headers: { authorization: `bearer ${authToken}` },
			variables: { input: { token } },
		});
		expect(result1.errors).toBeUndefined();
		assertToBeNonNullish(result1.data?.verifyEmail);
		expect(result1.data.verifyEmail.success).toBe(true);

		// Manually revert verification status to test token reuse
		const { eq } = await import("drizzle-orm");
		const { usersTable } = await import("~/src/drizzle/tables/users");
		const { server } = await import("../../../../test/server");

		await server.drizzleClient
			.update(usersTable)
			.set({ isEmailAddressVerified: false })
			.where(eq(usersTable.id, userId));

		// 3. Second Verification (Fail)
		const result2 = await mercuriusClient.mutate(Mutation_verifyEmail, {
			headers: { authorization: `bearer ${authToken}` },
			variables: { input: { token } },
		});

		expect(result2.errors).toBeDefined();
		assertToBeNonNullish(result2.errors);
		expect(result2.errors?.[0]?.extensions?.code).toBe("invalid_arguments");
	});

	test("should fail when unauthenticated", async () => {
		// Clear headers
		mercuriusClient.setHeaders({});

		const result = await mercuriusClient.mutate(Mutation_verifyEmail, {
			variables: { input: { token: "some-token" } },
		});

		expect(result.errors).toBeDefined();
		assertToBeNonNullish(result.errors);
		expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
	});
});
