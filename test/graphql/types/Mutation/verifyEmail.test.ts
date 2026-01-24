import { initGraphQLTada } from "gql.tada";
import type { MockInstance } from "vitest";
import { afterEach, beforeEach, expect, suite, test, vi } from "vitest";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
import { emailService } from "~/src/services/email/emailServiceInstance";
import type { EmailJob, EmailResult } from "~/src/services/email/types";
import { assertToBeNonNullish } from "../../../helpers";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import type { introspection } from "../gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

const Mutation_sendVerificationEmail =
	gql(`mutation Mutation_sendVerificationEmail {
    sendVerificationEmail {
        success
        message
    }
}`);

const Mutation_verifyEmail =
	gql(`mutation Mutation_verifyEmail($input: MutationVerifyEmailInput!) {
    verifyEmail(input: $input) {
        success
        message
    }
}
`);

suite("Mutation field verifyEmail", () => {
	let sendEmailSpy: MockInstance<(job: EmailJob) => Promise<EmailResult>>;

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
		mercuriusClient.setHeaders({});
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
			| { htmlBody?: string; textBody?: string }
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
		const firstCall = calls[0];
		assertToBeNonNullish(firstCall);
		const args = firstCall[0];
		const emailContent = args.htmlBody || args.textBody;
		const match = emailContent?.match(/token=([a-zA-Z0-9_-]+)/);
		const token = match?.[1];
		assertToBeNonNullish(token);

		// 2. EXPIRE the token in DB
		const { emailVerificationTokensTable } = await import(
			"~/src/drizzle/tables/emailVerificationTokens"
		);

		// Set expiresAt to 10 seconds ago
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
		expect(calls.length).toBeGreaterThan(0);
		const firstCall = calls[0];
		assertToBeNonNullish(firstCall);
		const args = firstCall[0];
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
	test("should return success if user is already verified (idempotency)", async () => {
		const { authToken, userId } = await createRegularUserUsingAdmin();

		// Manually mark user as verified
		const { eq } = await import("drizzle-orm");
		const { usersTable } = await import("~/src/drizzle/tables/users");
		const { server } = await import("../../../../test/server");

		await server.drizzleClient
			.update(usersTable)
			.set({ isEmailAddressVerified: true })
			.where(eq(usersTable.id, userId));

		// Verify with A VALID LOOKING token (schema validation requires 64 char hex usually for sha256 or similar)
		const validLengthToken = "a".repeat(64);

		// Verify (should bypass token check because user is already verified)
		const result = await mercuriusClient.mutate(Mutation_verifyEmail, {
			headers: { authorization: `bearer ${authToken}` },
			variables: { input: { token: validLengthToken } },
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.verifyEmail);
		expect(result.data.verifyEmail.success).toBe(true);
		expect(result.data.verifyEmail.message).toMatch(/already.*verified/i);
	});

	test("should fail if token belongs to another user", async () => {
		// User A (victim)
		const userA = await createRegularUserUsingAdmin();
		// User B (attacker)
		const userB = await createRegularUserUsingAdmin();

		// 1. Send verification for User A
		sendEmailSpy.mockClear();
		await mercuriusClient.mutate(Mutation_sendVerificationEmail, {
			headers: { authorization: `bearer ${userA.authToken}` },
		});

		const calls = sendEmailSpy.mock.calls;
		expect(calls.length).toBeGreaterThan(0);
		const firstCall = calls[0];
		assertToBeNonNullish(firstCall);
		const args = firstCall[0];
		const emailContent = args.htmlBody || args.textBody;
		const match = emailContent?.match(/token=([a-zA-Z0-9_-]+)/);
		const tokenA = match?.[1];
		assertToBeNonNullish(tokenA);

		// 2. User B tries to verify using User A's token
		const result = await mercuriusClient.mutate(Mutation_verifyEmail, {
			headers: { authorization: `bearer ${userB.authToken}` },
			variables: { input: { token: tokenA } },
		});

		expect(result.errors).toBeDefined();
		assertToBeNonNullish(result.errors);
		expect(result.errors?.[0]?.extensions?.code).toBe("forbidden_action");
	});

	test("should fail if user is not found in database (unexpected)", async () => {
		const { authToken, userId } = await createRegularUserUsingAdmin();

		// Delete user
		const { eq } = await import("drizzle-orm");
		const { usersTable } = await import("~/src/drizzle/tables/users");
		const { server } = await import("../../../../test/server");

		await server.drizzleClient
			.delete(usersTable)
			.where(eq(usersTable.id, userId));

		// MUST use valid token format to pass argument validation
		const validLengthToken = "a".repeat(64);

		const result = await mercuriusClient.mutate(Mutation_verifyEmail, {
			headers: { authorization: `bearer ${authToken}` },
			variables: { input: { token: validLengthToken } },
		});

		expect(result.errors).toBeDefined();
		assertToBeNonNullish(result.errors);
		expect(result.errors?.[0]?.extensions?.code).toBe("unexpected");
	});
});
