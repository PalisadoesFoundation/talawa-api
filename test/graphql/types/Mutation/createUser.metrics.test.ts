import { faker } from "@faker-js/faker";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { assertToBeNonNullish, waitForMetricsSnapshot } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createUser,
	Mutation_deleteUser,
	Query_signIn,
} from "../documentNodes";

describe("Mutation createUser - Performance Metrics", () => {
	let authToken: string;
	let createdUserId: string | undefined;

	beforeEach(async () => {
		// Sign in as admin to get auth token
		const signInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		assertToBeNonNullish(signInResult.data.signIn?.authenticationToken);
		authToken = signInResult.data.signIn.authenticationToken;
	});

	afterEach(async () => {
		// Clean up any created users if needed
		if (createdUserId) {
			try {
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: { id: createdUserId },
					},
				});
			} catch (_error) {
				// Ignore cleanup errors - user might already be deleted
			}
			createdUserId = undefined;
		}
	});

	describe("metrics collection", () => {
		it("should record mutation:createUser metric on successful mutation", async () => {
			const snapshotPromise = waitForMetricsSnapshot(
				server,
				(snapshot) => snapshot.ops["mutation:createUser"] !== undefined,
			);

			// Execute mutation
			const result = await mercuriusClient.mutate(Mutation_createUser, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						emailAddress: `test${faker.string.ulid()}@email.com`,
						isEmailAddressVerified: false,
						name: "Test User",
						password: "testpassword",
						role: "regular",
					},
				},
			});

			// Verify mutation succeeded
			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data.createUser?.user?.id);
			createdUserId = result.data.createUser.user.id;

			const snapshot = await snapshotPromise;
			const op = snapshot.ops["mutation:createUser"];
			assertToBeNonNullish(op);
			expect(op.count).toBeGreaterThanOrEqual(1);
			expect(op.ms).toBeGreaterThanOrEqual(0);
		});

		it("should record mutation:createUser metric even on authentication failure", async () => {
			const snapshotPromise = waitForMetricsSnapshot(
				server,
				(snapshot) => snapshot.ops["mutation:createUser"] !== undefined,
			);

			// Execute mutation without auth token (should fail)
			const result = await mercuriusClient.mutate(Mutation_createUser, {
				variables: {
					input: {
						emailAddress: `test${faker.string.ulid()}@email.com`,
						isEmailAddressVerified: false,
						name: "Test User",
						password: "testpassword",
						role: "regular",
					},
				},
			});

			// Verify mutation failed with unauthenticated error
			expect(result.data.createUser).toBeNull();
			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");

			// Even on failure, metrics should be recorded
			const snapshot = await snapshotPromise;
			const op = snapshot.ops["mutation:createUser"];
			assertToBeNonNullish(op);
			expect(op.count).toBeGreaterThanOrEqual(1);
		});
	});
});
