import { expect, suite, test, vi } from "vitest";

interface MockFieldBuilder {
	field: ReturnType<typeof vi.fn>;
}

interface FieldConfig {
	type: string;
	description: string;
	complexity: number;
	resolve: (...args: unknown[]) => unknown;
}

interface ImplementConfig {
	fields: (builder: MockFieldBuilder) => Record<string, FieldConfig>;
}

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
			// biome-ignore lint/suspicious/noExplicitAny: Type assertion needed to access Pothos internal structure
			const config = call[0] as any as ImplementConfig;
			if (typeof config?.fields === "function") {
				const mockBuilder: MockFieldBuilder = {
					field: vi.fn((cfg) => cfg),
				};
				const fields = config.fields(mockBuilder);
				return "mobilePhoneNumber" in fields;
			}
			return false;
		});

		expect(registrationCall).toBeDefined();

		// Verify the field configuration
		if (registrationCall) {
			// biome-ignore lint/suspicious/noExplicitAny: Type assertion needed to access Pothos internal structure
			const config = registrationCall[0] as any as ImplementConfig;
			if (config?.fields) {
				const mockBuilder: MockFieldBuilder = {
					field: vi.fn((cfg) => cfg),
				};
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
