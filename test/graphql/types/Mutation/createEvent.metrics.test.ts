import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eventsTable } from "~/src/drizzle/tables/events";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { assertToBeNonNullish, waitForMetricsSnapshot } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createEvent,
	Mutation_createOrganization,
	Query_signIn,
} from "../documentNodes";

describe("Mutation createEvent - Performance Metrics", () => {
	let authToken: string;
	const createdEventIds: string[] = [];
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
		// Clean up created events
		for (const eventId of createdEventIds) {
			try {
				await server.drizzleClient
					.delete(eventsTable)
					.where(eq(eventsTable.id, eventId));
			} catch (_error) {
				// Ignore cleanup errors - event might already be deleted
			}
		}
		createdEventIds.length = 0;

		// Clean up created organizations
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
		it("should record mutation:createEvent metric on successful mutation", async () => {
			// Create organization first
			const orgResult = await mercuriusClient.mutate(
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
			assertToBeNonNullish(orgResult.data.createOrganization?.id);
			const orgId = orgResult.data.createOrganization.id;
			createdOrgIds.push(orgId);

			const snapshotPromise = waitForMetricsSnapshot(
				server,
				(snapshot) => snapshot.ops["mutation:createEvent"] !== undefined,
			);

			// Execute mutation
			const result = await mercuriusClient.mutate(Mutation_createEvent, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						organizationId: orgId,
						name: `Test Event ${faker.string.uuid()}`,
						description: "Test event description",
						startAt: new Date(Date.now() + 3600000).toISOString(),
						endAt: new Date(Date.now() + 7200000).toISOString(),
						location: "Test Location",
					},
				},
			});

			// Verify mutation succeeded
			expect(result.errors).toBeUndefined();
			assertToBeNonNullish(result.data.createEvent?.id);
			createdEventIds.push(result.data.createEvent.id);

			const snapshot = await snapshotPromise;
			const op = snapshot.ops["mutation:createEvent"];
			assertToBeNonNullish(op);
			expect(op.count).toBeGreaterThanOrEqual(1);
			expect(op.ms).toBeGreaterThanOrEqual(0);
		});

		it("should record mutation:createEvent metric even on authentication failure", async () => {
			const snapshotPromise = waitForMetricsSnapshot(
				server,
				(snapshot) => snapshot.ops["mutation:createEvent"] !== undefined,
			);

			// Execute mutation without auth token (should fail)
			const result = await mercuriusClient.mutate(Mutation_createEvent, {
				variables: {
					input: {
						organizationId: faker.string.uuid(),
						name: `Test Event ${faker.string.uuid()}`,
						description: "Test event description",
						startAt: new Date(Date.now() + 3600000).toISOString(),
						endAt: new Date(Date.now() + 7200000).toISOString(),
						location: "Test Location",
					},
				},
			});

			// Verify mutation failed with unauthenticated error
			expect(result.data.createEvent).toBeNull();
			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");

			// Even on failure, metrics should be recorded
			const snapshot = await snapshotPromise;
			const op = snapshot.ops["mutation:createEvent"];
			assertToBeNonNullish(op);
			expect(op.count).toBeGreaterThanOrEqual(1);
		});
	});
});
