import { faker } from "@faker-js/faker";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { Mutation_createUser, Query_signIn } from "../documentNodes";

describe("Mutation createUser - Performance Metrics", () => {
	let authToken: string;

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
	});

	describe("metrics collection", () => {
		it("should record mutation:createUser metric on successful mutation", async () => {
			// Get initial snapshot count
			const initialSnapshots = server.getMetricsSnapshots?.() ?? [];
			const initialSnapshotCount = initialSnapshots.length;

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

			// Get snapshots after mutation
			const snapshots = server.getMetricsSnapshots?.() ?? [];
			expect(snapshots.length).toBeGreaterThan(initialSnapshotCount);

			// Find snapshot with our mutation metric
			const mutationSnapshot = snapshots.find(
				(s) => s.ops["mutation:createUser"] !== undefined,
			);

			expect(mutationSnapshot).toBeDefined();
			if (mutationSnapshot) {
				const op = mutationSnapshot.ops["mutation:createUser"];
				expect(op).toBeDefined();
				expect(op?.count).toBeGreaterThanOrEqual(1);
				expect(op?.ms).toBeGreaterThanOrEqual(0);
			}
		});

		it("should record mutation:createUser metric even on authentication failure", async () => {
			// Get initial snapshot count
			const initialSnapshots = server.getMetricsSnapshots?.() ?? [];
			const initialSnapshotCount = initialSnapshots.length;

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

			// Get snapshots after mutation
			const snapshots = server.getMetricsSnapshots?.() ?? [];
			expect(snapshots.length).toBeGreaterThan(initialSnapshotCount);

			// Find snapshot with our mutation metric
			const mutationSnapshot = snapshots.find(
				(s) => s.ops["mutation:createUser"] !== undefined,
			);

			// Even on failure, metrics should be recorded
			expect(mutationSnapshot).toBeDefined();
			if (mutationSnapshot) {
				const op = mutationSnapshot.ops["mutation:createUser"];
				expect(op).toBeDefined();
				expect(op?.count).toBeGreaterThanOrEqual(1);
			}
		});
	});
});
