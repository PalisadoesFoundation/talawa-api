import { expect, suite, test, vi } from "vitest";

/**
 * Separate test file to verify schema registration without mocking.
 * This ensures lines 70-81 in mobilePhoneNumber.ts are covered.
 */
suite("User.mobilePhoneNumber - Schema Registration", () => {
	test("module registers mobilePhoneNumber field on User type", async () => {
		// Import User and spy on implement before importing mobilePhoneNumber
		const UserModule = await import("~/src/graphql/types/User/User");
		const implementSpy = vi.spyOn(UserModule.User, "implement");

		// Import the module which triggers the User.implement call
		await import("~/src/graphql/types/User/mobilePhoneNumber");

		// Verify User.implement was called
		expect(implementSpy).toHaveBeenCalled();

		// Find the call that registered mobilePhoneNumber
		const registrationCall = implementSpy.mock.calls.find((call) => {
			// biome-ignore lint/suspicious/noExplicitAny: Dynamic import makes type inference difficult
			const config = call[0] as any;
			if (typeof config?.fields === "function") {
				// biome-ignore lint/suspicious/noExplicitAny: Mock builder needs to match ObjectFieldBuilder interface
				const mockBuilder = { field: vi.fn((cfg) => cfg) } as any;
				const fields = config.fields(mockBuilder);
				return "mobilePhoneNumber" in fields;
			}
			return false;
		});

		expect(registrationCall).toBeDefined();

		// Verify the field configuration
		if (registrationCall) {
			// biome-ignore lint/suspicious/noExplicitAny: Dynamic import makes type inference difficult
			const config = registrationCall[0] as any;
			if (config?.fields) {
				// biome-ignore lint/suspicious/noExplicitAny: Mock builder needs to match ObjectFieldBuilder interface
				const mockBuilder = { field: vi.fn((cfg) => cfg) } as any;
				const fields = config.fields(mockBuilder);

				expect(fields.mobilePhoneNumber).toBeDefined();
				expect(mockBuilder.field).toHaveBeenCalledWith(
					expect.objectContaining({
						type: "PhoneNumber",
						description: expect.stringContaining("phone number"),
						complexity: expect.any(Number),
						resolve: expect.any(Function),
					}),
				);
			}
		}
	});
});
