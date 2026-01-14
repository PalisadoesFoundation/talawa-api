import type { MockInstance } from "vitest";
import { afterEach, beforeEach, expect, suite, test, vi } from "vitest";
import { emailService } from "~/src/services/email/emailServiceInstance";
import type { EmailJob, EmailResult } from "~/src/services/email/types";
import { assertToBeNonNullish } from "../../../helpers";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import { Mutation_sendVerificationEmail } from "../documentNodes";

suite("Mutation field sendVerificationEmail", () => {
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
	});

	test("should return success when authenticated", async () => {
		const { authToken } = await createRegularUserUsingAdmin();

		// Clear Welcome email call
		sendEmailSpy.mockClear();

		const result = await mercuriusClient.mutate(
			Mutation_sendVerificationEmail,
			{
				headers: { authorization: `bearer ${authToken}` },
			},
		);

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.sendVerificationEmail);
		expect(result.data.sendVerificationEmail.success).toBe(true);
		expect(result.data.sendVerificationEmail.message).toBeDefined();

		// Should send verification email
		expect(sendEmailSpy).toHaveBeenCalledTimes(1);
	});

	test("should fail when unauthenticated", async () => {
		// Ensure headers are cleared
		mercuriusClient.setHeaders({});

		const result = await mercuriusClient.mutate(Mutation_sendVerificationEmail);

		expect(result.errors).toBeDefined();
		const errors = result.errors;
		assertToBeNonNullish(errors);
		const error = errors[0];
		assertToBeNonNullish(error);
		expect(error.extensions?.code).toBe("unauthenticated");
	});

	test("should return success and not send email when already verified", async () => {
		const { userId, authToken } = await createRegularUserUsingAdmin();

		// Manually mark user as verified directly in DB
		const { eq } = await import("drizzle-orm");
		const { usersTable } = await import("~/src/drizzle/tables/users");
		const { server } = await import("../../../../test/server");

		await server.drizzleClient
			.update(usersTable)
			.set({ isEmailAddressVerified: true })
			.where(eq(usersTable.id, userId));

		// Clear Welcome email call
		sendEmailSpy.mockClear();

		const result = await mercuriusClient.mutate(
			Mutation_sendVerificationEmail,
			{
				headers: { authorization: `bearer ${authToken}` },
			},
		);

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.sendVerificationEmail);
		expect(result.data.sendVerificationEmail.success).toBe(true);
		expect(result.data.sendVerificationEmail.message).toMatch(
			/already.*verified/i,
		);

		// Should NOT send email
		expect(sendEmailSpy).not.toHaveBeenCalled();
	});

	test("should fail when rate limit exceeded", async () => {
		const { userId, authToken } = await createRegularUserUsingAdmin();

		// Mock the rate limit store
		const { EMAIL_VERIFICATION_RATE_LIMITS } = await import(
			"~/src/utilities/emailVerificationRateLimit"
		);
		EMAIL_VERIFICATION_RATE_LIMITS.set(userId, {
			count: 3,
			windowStart: Date.now(),
		});

		const result = await mercuriusClient.mutate(
			Mutation_sendVerificationEmail,
			{
				headers: { authorization: `bearer ${authToken}` },
			},
		);

		expect(result.errors).toBeDefined();
		assertToBeNonNullish(result.errors);
		expect(result.errors?.[0]?.extensions?.code).toBe("too_many_requests");

		// Cleanup
		EMAIL_VERIFICATION_RATE_LIMITS.delete(userId);
	});

	test("should fail when user not found (unexpected)", async () => {
		const { userId, authToken } = await createRegularUserUsingAdmin();

		// Delete the user from DB
		const { eq } = await import("drizzle-orm");
		const { usersTable } = await import("~/src/drizzle/tables/users");
		const { server } = await import("../../../../test/server");

		await server.drizzleClient
			.delete(usersTable)
			.where(eq(usersTable.id, userId));

		const result = await mercuriusClient.mutate(
			Mutation_sendVerificationEmail,
			{
				headers: { authorization: `bearer ${authToken}` },
			},
		);

		expect(result.errors).toBeDefined();
		assertToBeNonNullish(result.errors);
		// Assuming the resolver throws an error when user is missing from context or DB lookup fails
		expect(result.errors?.[0]?.extensions?.code).toBe("unexpected");
	});
	test("should return success even if email service fails (success: false)", async () => {
		const { authToken } = await createRegularUserUsingAdmin();

		// Mock email failure
		sendEmailSpy.mockResolvedValue({
			id: "mock-id",
			success: false,
			error: "Mock Provider Error",
		});

		const result = await mercuriusClient.mutate(
			Mutation_sendVerificationEmail,
			{
				headers: { authorization: `bearer ${authToken}` },
			},
		);

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.sendVerificationEmail);
		expect(result.data.sendVerificationEmail.success).toBe(true);
		expect(result.data.sendVerificationEmail.message).toBeDefined();

		expect(sendEmailSpy).toHaveBeenCalled();
	});

	test("should return success even if email service throws exception", async () => {
		const { authToken } = await createRegularUserUsingAdmin();

		// Mock email exception
		sendEmailSpy.mockRejectedValue(new Error("Network Error"));

		const result = await mercuriusClient.mutate(
			Mutation_sendVerificationEmail,
			{
				headers: { authorization: `bearer ${authToken}` },
			},
		);

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.sendVerificationEmail);
		expect(result.data.sendVerificationEmail.success).toBe(true);
		expect(result.data.sendVerificationEmail.message).toBeDefined();

		expect(sendEmailSpy).toHaveBeenCalled();
	});
});
