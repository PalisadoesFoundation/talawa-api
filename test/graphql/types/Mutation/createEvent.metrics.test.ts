import { faker } from "@faker-js/faker";
import { beforeEach, describe, expect, it } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Query_signIn,
} from "../documentNodes";

/**
 * Test suite for createEvent mutation performance tracking.
 * Verifies that performance metrics are properly collected for the createEvent mutation
 * using end-to-end Mercurius integration tests.
 */
describe("createEvent mutation performance tracking", () => {
	let authToken: string;
	let organizationId: string;

	beforeEach(async () => {
		// Sign in as admin
		const signInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		assertToBeNonNullish(signInResult.data?.signIn);
		assertToBeNonNullish(signInResult.data.signIn.authenticationToken);
		authToken = signInResult.data.signIn.authenticationToken;
		assertToBeNonNullish(signInResult.data.signIn.user?.id);

		// Create an organization to attach events to
		const orgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: `Test Org ${faker.string.ulid()}`,
						description: "Test organization for event metrics",
						countryCode: "us",
					},
				},
			},
		);
		assertToBeNonNullish(orgResult.data?.createOrganization?.id);
		organizationId = orgResult.data.createOrganization.id;

		// Explicitly add admin as a member of the organization
		const memberResult = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId,
						memberId: signInResult.data.signIn.user.id,
						role: "administrator",
					},
				},
			},
		);
		assertToBeNonNullish(memberResult.data?.createOrganizationMembership?.id);
	});

	it("should track metrics for standard event creation", async () => {
		const initialSnapshots = server.getMetricsSnapshots?.(1) ?? [];

		const result = await mercuriusClient.mutate(Mutation_createEvent, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: `Standard Event ${faker.string.ulid()}`,
					description: "Standard event description",
					organizationId: organizationId,
					startAt: new Date(Date.now() + 10000).toISOString(),
					endAt: new Date(Date.now() + 3600000).toISOString(),
					isPublic: true,
					location: "Test Location",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.createEvent);
		expect(result.data.createEvent.id).toBeDefined();

		// Verify performance metrics
		const snapshots = server.getMetricsSnapshots?.(1) ?? [];
		expect(snapshots.length).toBeGreaterThan(initialSnapshots.length);

		const latestSnapshot = snapshots[0];
		assertToBeNonNullish(latestSnapshot);

		// Main operation
		const mainOp = latestSnapshot.ops["mutation:createEvent"];
		expect(mainOp).toBeDefined();
		expect(mainOp?.count).toBe(1);
		expect(mainOp?.ms).toBeGreaterThanOrEqual(0);

		// Sub-operations
		const validationOp = latestSnapshot.ops.validation;
		expect(validationOp).toBeDefined();
		expect(validationOp?.count).toBe(1);

		const dbInsertOp = latestSnapshot.ops["db:event-insert"];
		expect(dbInsertOp).toBeDefined();
		expect(dbInsertOp?.count).toBe(1);
	});

	it("should track metrics for recurring event creation", async () => {
		const result = await mercuriusClient.mutate(Mutation_createEvent, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: `Recurring Event ${faker.string.ulid()}`,
					description: "Recurring event description",
					organizationId: organizationId,
					startAt: new Date(Date.now() + 10000).toISOString(),
					endAt: new Date(Date.now() + 3600000).toISOString(),
					isPublic: true,
					location: "Test Location",
					recurrence: {
						frequency: "DAILY",
						interval: 1,
						count: 2,
					},
				},
			},
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.createEvent);

		// Verify performance metrics
		const snapshots = server.getMetricsSnapshots?.(1) ?? [];
		const latestSnapshot = snapshots[0];
		assertToBeNonNullish(latestSnapshot);

		// Main operation
		const mainOp = latestSnapshot.ops["mutation:createEvent"];
		expect(mainOp).toBeDefined();

		// Sub-operations specific to recurrence
		const ruleInsertOp = latestSnapshot.ops["db:recurrence-rule-insert"];
		expect(ruleInsertOp).toBeDefined();
		expect(ruleInsertOp?.count).toBe(1);

		const instanceGenOp =
			latestSnapshot.ops["db:recurrence-instance-generation"];
		expect(instanceGenOp).toBeDefined();
		expect(instanceGenOp?.count).toBe(1);
	});

	it("should track metrics even when mutation fails", async () => {
		const initialSnapshots = server.getMetricsSnapshots?.(1) ?? [];

		// Try to create event with invalid data (e.g. non-existent organization)
		const result = await mercuriusClient.mutate(Mutation_createEvent, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: "Fail Event",
					description: "This should fail",
					organizationId: faker.string.uuid(), // Non-existent ID
					startAt: new Date(Date.now() + 10000).toISOString(),
					endAt: new Date(Date.now() + 3600000).toISOString(),
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.data?.createEvent).toBeNull();

		// Verify performance metrics were still collected
		const snapshots = server.getMetricsSnapshots?.(1) ?? [];
		expect(snapshots.length).toBeGreaterThan(initialSnapshots.length);

		const latestSnapshot = snapshots[0];
		assertToBeNonNullish(latestSnapshot);

		const mainOp = latestSnapshot.ops["mutation:createEvent"];
		expect(mainOp).toBeDefined();
		expect(mainOp?.count).toBe(1);
	});
});
