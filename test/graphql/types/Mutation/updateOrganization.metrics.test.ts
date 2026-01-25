import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { assertToBeNonNullish, waitForMetricsSnapshot } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_updateOrganization,
	Query_signIn,
} from "../documentNodes";

describe("Mutation updateOrganization - Performance Metrics", () => {
	let authToken: string;
	const createdOrgIds: string[] = [];

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
		// Clean up any created organizations
		for (const orgId of createdOrgIds) {
			try {
				await server.drizzleClient
					.delete(organizationsTable)
					.where(eq(organizationsTable.id, orgId));
			} catch (_error) {
				// Ignore cleanup errors - organization might already be deleted
			}
		}
		createdOrgIds.length = 0;
	});

	describe("metrics collection", () => {
		it("should record mutation:updateOrganization metric on successful mutation", async () => {
			// Create organization first
			const createResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							name: `Test Org ${faker.string.uuid()}`,
							countryCode: "us",
						},
					},
				},
			);
			assertToBeNonNullish(createResult.data.createOrganization?.id);
			const orgId = createResult.data.createOrganization.id;
			createdOrgIds.push(orgId);

			const snapshotPromise = waitForMetricsSnapshot(
				server,
				(snapshot) => snapshot.ops["mutation:updateOrganization"] !== undefined,
			);

			// Execute mutation
			const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						id: orgId,
						name: `Updated Org ${faker.string.uuid()}`,
					},
				},
			});

			// Verify mutation succeeded
			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data.updateOrganization?.id);

			const snapshot = await snapshotPromise;
			const op = snapshot.ops["mutation:updateOrganization"];
			assertToBeNonNullish(op);
			expect(op.count).toBeGreaterThanOrEqual(1);
			expect(op.ms).toBeGreaterThanOrEqual(0);
		});

		it("should record mutation:updateOrganization metric even on authentication failure", async () => {
			const snapshotPromise = waitForMetricsSnapshot(
				server,
				(snapshot) => snapshot.ops["mutation:updateOrganization"] !== undefined,
			);

			// Execute mutation without auth token (should fail)
			const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
				variables: {
					input: {
						id: faker.string.uuid(),
						name: `Updated Org ${faker.string.uuid()}`,
					},
				},
			});

			// Verify mutation failed with unauthenticated error
			expect(result.data.updateOrganization).toBeNull();
			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");

			// Even on failure, metrics should be recorded
			const snapshot = await snapshotPromise;
			const op = snapshot.ops["mutation:updateOrganization"];
			assertToBeNonNullish(op);
			expect(op.count).toBeGreaterThanOrEqual(1);
		});
	});
});
