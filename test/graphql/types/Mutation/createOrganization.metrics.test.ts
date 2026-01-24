import { faker } from "@faker-js/faker";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { assertToBeNonNullish, waitForMetricsSnapshot } from "../../../helpers";
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
			const snapshotPromise = waitForMetricsSnapshot(
				server,
				(snapshot) => snapshot.ops["mutation:createOrganization"] !== undefined,
			);

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

			const snapshot = await snapshotPromise;
			const op = snapshot.ops["mutation:createOrganization"];
			assertToBeNonNullish(op);
			expect(op.count).toBeGreaterThanOrEqual(1);
			expect(op.ms).toBeGreaterThanOrEqual(0);
		});

		it("should record mutation:createOrganization metric on authentication failure", async () => {
			const snapshotPromise = waitForMetricsSnapshot(
				server,
				(snapshot) => snapshot.ops["mutation:createOrganization"] !== undefined,
			);

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
			expect(result.data.createOrganization).toBeNull();
			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");

			// Even on failure, metrics should be recorded
			const snapshot = await snapshotPromise;
			const op = snapshot.ops["mutation:createOrganization"];
			assertToBeNonNullish(op);
			expect(op.count).toBeGreaterThanOrEqual(1);
		});
	});
});
