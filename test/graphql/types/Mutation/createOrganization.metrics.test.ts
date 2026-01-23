import { faker } from "@faker-js/faker";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_deleteOrganization,
	Query_signIn,
} from "../documentNodes";

describe("Mutation createOrganization - Performance Metrics", () => {
	let authToken: string;
	let createdOrgId: string | undefined;

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
		// Clean up created organization
		if (createdOrgId) {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						id: createdOrgId,
					},
				},
			});
			createdOrgId = undefined;
		}
	});

	describe("metrics collection", () => {
		it("should record mutation:createOrganization metric on successful mutation", async () => {
			// Get initial snapshot count
			const initialSnapshots = server.getMetricsSnapshots?.() ?? [];
			const initialSnapshotCount = initialSnapshots.length;

			// Execute mutation
			const result = await mercuriusClient.mutate(Mutation_createOrganization, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						name: `Test Org ${faker.string.ulid()}`,
						description: "Test organization for metrics",
					},
				},
			});

			// Verify mutation succeeded
			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data.createOrganization?.id);
			createdOrgId = result.data.createOrganization.id;

			// Wait for metric to appear
			let snapshots = server.getMetricsSnapshots?.() ?? [];
			let mutationSnapshot: (typeof snapshots)[0] | undefined;

			for (let i = 0; i < 30; i++) {
				snapshots = server.getMetricsSnapshots?.() ?? [];
				const newSnapshotsCount = snapshots.length - initialSnapshotCount;
				const newSnapshots = snapshots.slice(
					0,
					newSnapshotsCount > 0 ? newSnapshotsCount : snapshots.length,
				);
				mutationSnapshot = newSnapshots.find(
					(s) => s.ops["mutation:createOrganization"] !== undefined,
				);
				if (mutationSnapshot) break;
				await new Promise((resolve) => setTimeout(resolve, 50));
			}

			assertToBeNonNullish(mutationSnapshot);
			const op = mutationSnapshot.ops["mutation:createOrganization"];
			assertToBeNonNullish(op);
			expect(op.count).toBeGreaterThanOrEqual(1);
			expect(op.ms).toBeGreaterThanOrEqual(0);
		});

		it("should record mutation:createOrganization metric on authentication failure", async () => {
			// Get initial snapshot count
			const initialSnapshots = server.getMetricsSnapshots?.() ?? [];
			const initialSnapshotCount = initialSnapshots.length;

			// Execute mutation without auth token (should fail)
			const result = await mercuriusClient.mutate(Mutation_createOrganization, {
				variables: {
					input: {
						name: `Test Org ${faker.string.ulid()}`,
						description: "Test organization",
					},
				},
			});

			// Verify mutation failed
			// Verify mutation failed
			expect(result.data.createOrganization).toBeNull();
			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");

			// Wait for metric to appear
			let snapshots = server.getMetricsSnapshots?.() ?? [];
			let mutationSnapshot: (typeof snapshots)[0] | undefined;

			for (let i = 0; i < 30; i++) {
				snapshots = server.getMetricsSnapshots?.() ?? [];
				const newSnapshotsCount = snapshots.length - initialSnapshotCount;
				const newSnapshots = snapshots.slice(
					0,
					newSnapshotsCount > 0 ? newSnapshotsCount : snapshots.length,
				);
				mutationSnapshot = newSnapshots.find(
					(s) => s.ops["mutation:createOrganization"] !== undefined,
				);
				if (mutationSnapshot) break;
				await new Promise((resolve) => setTimeout(resolve, 50));
			}

			// Even on failure, metrics should be recorded
			assertToBeNonNullish(mutationSnapshot);
			const op = mutationSnapshot.ops["mutation:createOrganization"];
			assertToBeNonNullish(op);
			expect(op.count).toBeGreaterThanOrEqual(1);
		});
	});
});
