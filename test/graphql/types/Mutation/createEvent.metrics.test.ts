import { faker } from "@faker-js/faker";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { assertToBeNonNullish, waitForMetricsSnapshot } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteOrganization,
	Query_signIn,
} from "../documentNodes";

describe("Mutation createEvent - Performance Metrics", () => {
	let authToken: string;
	let orgId: string | undefined;
	let userId: string | undefined;

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
		assertToBeNonNullish(signInResult.data.signIn?.user?.id);
		authToken = signInResult.data.signIn.authenticationToken;
		userId = signInResult.data.signIn.user.id;

		// Create an organization for events
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						name: `Test Org ${faker.string.ulid()}`,
						description: "Test organization for events",
					},
				},
			},
		);
		assertToBeNonNullish(createOrgResult.data.createOrganization?.id);
		orgId = createOrgResult.data.createOrganization.id;

		// Create membership for the user
		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: {
				authorization: `bearer ${authToken}`,
			},
			variables: {
				input: {
					memberId: userId,
					organizationId: orgId,
					role: "administrator",
				},
			},
		});
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
		it("should record mutation:createEvent metric on successful mutation", async () => {
			// Assert org was created - fail fast if setup failed
			assertToBeNonNullish(orgId);

			const snapshotPromise = waitForMetricsSnapshot(
				server,
				(snapshot) => snapshot.ops["mutation:createEvent"] !== undefined,
			);

			// Future date for event
			const startAt = new Date();
			startAt.setDate(startAt.getDate() + 1);
			const endAt = new Date(startAt);
			endAt.setHours(endAt.getHours() + 2);

			// Execute mutation
			const result = await mercuriusClient.mutate(Mutation_createEvent, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						organizationId: orgId,
						name: "Test Event",
						description: "Test event for metrics",
						startAt: startAt.toISOString(),
						endAt: endAt.toISOString(),
					},
				},
			});

			// Verify mutation succeeded
			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data.createEvent?.id);

			const snapshot = await snapshotPromise;
			const op = snapshot.ops["mutation:createEvent"];
			assertToBeNonNullish(op);
			expect(op.count).toBeGreaterThanOrEqual(1);
			expect(op.ms).toBeGreaterThanOrEqual(0);
		});

		it("should record mutation:createEvent metric on authentication failure", async () => {
			const snapshotPromise = waitForMetricsSnapshot(
				server,
				(snapshot) => snapshot.ops["mutation:createEvent"] !== undefined,
			);

			// Future date for event
			const startAt = new Date();
			startAt.setDate(startAt.getDate() + 1);
			const endAt = new Date(startAt);
			endAt.setHours(endAt.getHours() + 2);

			// Execute mutation without auth token (should fail)
			const result = await mercuriusClient.mutate(Mutation_createEvent, {
				variables: {
					input: {
						organizationId: orgId ?? "fake-org-id",
						name: "Test Event",
						description: "Test event",
						startAt: startAt.toISOString(),
						endAt: endAt.toISOString(),
					},
				},
			});

			// Verify mutation failed
			expect(result.data.createEvent).toBeNull();
			expect(result.errors).toBeDefined();

			// Even on failure, metrics should be recorded
			const snapshot = await snapshotPromise;
			const op = snapshot.ops["mutation:createEvent"];
			assertToBeNonNullish(op);
			expect(op.count).toBeGreaterThanOrEqual(1);
		});
	});
});
