import { faker } from "@faker-js/faker";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_deleteOrganization,
	Mutation_updateOrganization,
	Query_signIn,
} from "../documentNodes";

describe("Mutation updateOrganization - Performance Metrics", () => {
	let authToken: string;
	let orgId: string | undefined;

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

		// Create an organization to update
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						name: `Test Org ${faker.string.ulid()}`,
						description: "Test organization for update",
					},
				},
			},
		);
		assertToBeNonNullish(createOrgResult.data.createOrganization?.id);
		orgId = createOrgResult.data.createOrganization.id;
	});

	afterEach(async () => {
		// Clean up created organization
		if (orgId) {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						id: orgId,
					},
				},
			});
			orgId = undefined;
		}
	});

	describe("metrics collection", () => {
		it("should record mutation:updateOrganization metric on successful mutation", async () => {
			// Assert org was created - fail fast if setup failed
			assertToBeNonNullish(orgId);

			// Get initial snapshot count
			const initialSnapshots = server.getMetricsSnapshots?.() ?? [];
			const initialSnapshotCount = initialSnapshots.length;

			// Execute mutation
			const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						id: orgId,
						description: "Updated description",
					},
				},
			});

			// Verify mutation succeeded
			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data.updateOrganization?.id);

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
					(s) => s.ops["mutation:updateOrganization"] !== undefined,
				);
				if (mutationSnapshot) break;
				await new Promise((resolve) => setTimeout(resolve, 50));
			}

			assertToBeNonNullish(mutationSnapshot);
			const op = mutationSnapshot.ops["mutation:updateOrganization"];
			assertToBeNonNullish(op);
			expect(op.count).toBeGreaterThanOrEqual(1);
			expect(op.ms).toBeGreaterThanOrEqual(0);
		});

		it("should record mutation:updateOrganization metric on authentication failure", async () => {
			// Get initial snapshot count
			const initialSnapshots = server.getMetricsSnapshots?.() ?? [];
			const initialSnapshotCount = initialSnapshots.length;

			// Execute mutation without auth token (should fail)
			const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
				variables: {
					input: {
						id: orgId ?? "fake-org-id",
						description: "Updated description",
					},
				},
			});

			// Verify mutation failed
			expect(result.data.updateOrganization).toBeNull();
			expect(result.errors).toBeDefined();

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
					(s) => s.ops["mutation:updateOrganization"] !== undefined,
				);
				if (mutationSnapshot) break;
				await new Promise((resolve) => setTimeout(resolve, 50));
			}

			// Even on failure, metrics should be recorded
			assertToBeNonNullish(mutationSnapshot);
			const op = mutationSnapshot.ops["mutation:updateOrganization"];
			assertToBeNonNullish(op);
			expect(op.count).toBeGreaterThanOrEqual(1);
		});
	});
});
