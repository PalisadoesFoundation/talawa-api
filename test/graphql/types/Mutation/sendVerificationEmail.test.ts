import { expect, suite, test } from "vitest";
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
});
