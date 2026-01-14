import { expect, test, suite } from "vitest";
import { mercuriusClient } from "../client";
import { Mutation_sendVerificationEmail } from "../documentNodes";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import { assertToBeNonNullish } from "../../../helpers";

suite("Mutation field sendVerificationEmail", () => {
    test("should return success when authenticated", async () => {
        const { authToken } = await createRegularUserUsingAdmin();

        const result = await mercuriusClient.mutate(Mutation_sendVerificationEmail, {
            headers: { authorization: `bearer ${authToken}` },
        });

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
        expect(result.errors![0].extensions?.code).toBe("unauthenticated");
    });
});
