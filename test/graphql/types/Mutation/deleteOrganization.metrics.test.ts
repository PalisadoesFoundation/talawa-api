import { faker } from "@faker-js/faker";
import { beforeEach, describe, expect, it } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_deleteOrganization,
	Query_signIn,
} from "../documentNodes";

describe("Mutation deleteOrganization - Performance Metrics", () => {
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

	describe("metrics collection", () => {
		it("should record mutation:deleteOrganization metric on successful mutation", async () => {
			// Create an organization to delete
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							name: `Test Org ${faker.string.ulid()}`,
							description: "Test organization for deletion",
						},
					},
				},
			);
			assertToBeNonNullish(createOrgResult.data.createOrganization?.id);
			const orgId = createOrgResult.data.createOrganization.id;

			// Get initial snapshot count
			const initialSnapshots = server.getMetricsSnapshots?.() ?? [];
			const initialSnapshotCount = initialSnapshots.length;

			// Execute delete mutation
			const result = await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						id: orgId,
					},
				},
			});

			// Verify mutation succeeded
			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data.deleteOrganization?.id);

			// Wait for metric to appear
			let snapshots = server.getMetricsSnapshots?.() ?? [];
			let mutationSnapshot: (typeof snapshots)[0] | undefined;

			for (let i = 0; i < 100; i++) {
				snapshots = server.getMetricsSnapshots?.() ?? [];
				const newSnapshots = snapshots.slice(
					0,
					snapshots.length - initialSnapshotCount,
				);
				mutationSnapshot = newSnapshots.find(
					(s) => s.ops["mutation:deleteOrganization"] !== undefined,
				);
				if (mutationSnapshot) break;
				await new Promise((resolve) => setTimeout(resolve, 50));
			}

			assertToBeNonNullish(mutationSnapshot);
			const op = mutationSnapshot.ops["mutation:deleteOrganization"];
			assertToBeNonNullish(op);
			expect(op.count).toBeGreaterThanOrEqual(1);
			expect(op.ms).toBeGreaterThanOrEqual(0);
		});

		it("should record mutation:deleteOrganization metric on authentication failure", async () => {
			// Get initial snapshot count
			const initialSnapshots = server.getMetricsSnapshots?.() ?? [];
			const initialSnapshotCount = initialSnapshots.length;

			// Execute mutation without auth token (should fail)
			const result = await mercuriusClient.mutate(Mutation_deleteOrganization, {
				variables: {
					input: {
						id: "fake-org-id",
					},
				},
			});

			// Verify mutation failed
			expect(result.data.deleteOrganization).toBeNull();
			expect(result.errors).toBeDefined();

			// Wait for metric to appear
			let snapshots = server.getMetricsSnapshots?.() ?? [];
			let mutationSnapshot: (typeof snapshots)[0] | undefined;

			for (let i = 0; i < 100; i++) {
				snapshots = server.getMetricsSnapshots?.() ?? [];
				const newSnapshots = snapshots.slice(
					0,
					snapshots.length - initialSnapshotCount,
				);
				mutationSnapshot = newSnapshots.find(
					(s) => s.ops["mutation:deleteOrganization"] !== undefined,
				);
				if (mutationSnapshot) break;
				await new Promise((resolve) => setTimeout(resolve, 50));
			}

			// Even on failure, metrics should be recorded
			assertToBeNonNullish(mutationSnapshot);
			const op = mutationSnapshot.ops["mutation:deleteOrganization"];
			assertToBeNonNullish(op);
			expect(op.count).toBeGreaterThanOrEqual(1);
		});
	});
});
