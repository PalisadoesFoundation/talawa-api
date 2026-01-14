import { expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import { Mutation_sendVerificationEmail } from "../documentNodes";

suite("Mutation field sendVerificationEmail", () => {
	test("should return success when authenticated", async () => {
		const { authToken } = await createRegularUserUsingAdmin();

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

		const { emailService } = await import(
			"~/src/services/email/emailServiceInstance"
		);
		const sendEmailSpy = vi.spyOn(emailService, "sendEmail");

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
		sendEmailSpy.mockRestore();
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
		expect(result.errors[0].extensions?.code).toBe("too_many_requests");

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
		expect(result.errors[0].extensions?.code).toBe("unexpected");
	});
});
