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
		// Get initial snapshot count
		const initialSnapshots = server.getMetricsSnapshots?.() ?? [];

		const result = await mercuriusClient.mutate(Mutation_createEvent, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: `Test Event ${faker.string.ulid()}`,
					description: "A test event description",
					organizationId,
					startAt: new Date(Date.now() + 86400000).toISOString(),
					endAt: new Date(Date.now() + 90000000).toISOString(),
					allDay: false,

					location: "Test Location",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.createEvent?.id);

		// Verify performance metrics were collected
		const snapshots = server.getMetricsSnapshots?.() ?? [];
		expect(snapshots.length).toBeGreaterThan(initialSnapshots.length);

		const newSnapshots = snapshots.slice(initialSnapshots.length);
		// Verify the specific mutation:createEvent metric was recorded
		const latestSnapshot = newSnapshots.find(
			(s) => s.ops["mutation:createEvent"] !== undefined,
		);
		assertToBeNonNullish(latestSnapshot);
		const op = latestSnapshot.ops["mutation:createEvent"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
		expect(op?.ms).toBeGreaterThanOrEqual(0);

		// Sub-operations
		const validationOp = latestSnapshot.ops.validation;
		expect(validationOp).toBeDefined();
		expect(validationOp?.count).toBe(1);

		const dbInsertOp = latestSnapshot.ops["db:event-insert"];
		expect(dbInsertOp).toBeDefined();
		expect(dbInsertOp?.count).toBe(1);
	});

	it("should track metrics for recurring event creation", async () => {
		const initialSnapshots = server.getMetricsSnapshots?.() ?? [];

		const result = await mercuriusClient.mutate(Mutation_createEvent, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: `Recurring Event ${faker.string.ulid()}`,
					description: "A recurring test event",
					organizationId,
					startAt: new Date(Date.now() + 86400000).toISOString(),
					endAt: new Date(Date.now() + 90000000).toISOString(),
					allDay: false,
					recurrence: {
						frequency: "WEEKLY",
						interval: 1,
						count: 5,
					},
					location: "Test Location",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.createEvent?.id);

		const snapshots = server.getMetricsSnapshots?.() ?? [];
		expect(snapshots.length).toBeGreaterThan(initialSnapshots.length);

		const newSnapshots = snapshots.slice(initialSnapshots.length);
		const latestSnapshot = newSnapshots.find(
			(s) => s.ops["mutation:createEvent"] !== undefined,
		);
		assertToBeNonNullish(latestSnapshot);
		const op = latestSnapshot.ops["mutation:createEvent"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
	});

	it("should track metrics even when event creation fails", async () => {
		const initialSnapshots = server.getMetricsSnapshots?.() ?? [];

		// Try to create event without required fields (or invalid data)
		// Assuming empty title might fail or similar validation
		const result = await mercuriusClient.mutate(Mutation_createEvent, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: "Fail Event",
					description: "This should fail due to invalid org",
					organizationId: faker.string.uuid(), // Non-existent ID causing logic failure
					startAt: new Date(Date.now() + 86400000).toISOString(),
					endAt: new Date(Date.now() + 90000000).toISOString(),
					allDay: false,
					recurrence: null,
					location: "Test Location",
				},
			},
		});

		expect(result.errors).toBeDefined();

		const snapshots = server.getMetricsSnapshots?.() ?? [];
		expect(snapshots.length).toBeGreaterThan(initialSnapshots.length);

		const newSnapshots = snapshots.slice(initialSnapshots.length);
		const latestSnapshot = newSnapshots.find(
			(s) => s.ops["mutation:createEvent"] !== undefined,
		);
		assertToBeNonNullish(latestSnapshot);
		const op = latestSnapshot.ops["mutation:createEvent"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
	});

	it("should track metrics even when authentication/authorization fails", async () => {
		const initialSnapshots = server.getMetricsSnapshots?.() ?? [];

		// Call mutation without authorization header
		const result = await mercuriusClient.mutate(Mutation_createEvent, {
			variables: {
				input: {
					name: `Unauthorized Event ${faker.string.ulid()}`,
					description: "This should fail due to missing auth",
					organizationId,
					startAt: new Date(Date.now() + 86400000).toISOString(),
					endAt: new Date(Date.now() + 90000000).toISOString(),
					allDay: false,
					location: "Test Location",
				},
			},
		});

		// Verify GraphQL call returns authentication/authorization error
		expect(result.errors).toBeDefined();
		expect(result.data?.createEvent).toBeNull();

		// Verify performance metrics were still collected
		const snapshots = server.getMetricsSnapshots?.() ?? [];
		expect(snapshots.length).toBeGreaterThan(initialSnapshots.length);

		const newSnapshots = snapshots.slice(initialSnapshots.length);
		// Verify a snapshot exists with ops["mutation:createEvent"] recorded
		const latestSnapshot = newSnapshots.find(
			(s) => s.ops["mutation:createEvent"] !== undefined,
		);
		assertToBeNonNullish(latestSnapshot);
		const op = latestSnapshot.ops["mutation:createEvent"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
	});
});
