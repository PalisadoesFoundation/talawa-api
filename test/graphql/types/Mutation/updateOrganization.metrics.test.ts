import { faker } from "@faker-js/faker";
import { beforeEach, describe, expect, it } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_updateOrganization,
	Query_signIn,
} from "../documentNodes";

/**
 * Test suite for updateOrganization mutation performance tracking.
 * Verifies that performance metrics are properly collected for the updateOrganization mutation
 * using end-to-end Mercurius integration tests.
 */
describe("updateOrganization mutation performance tracking", () => {
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

		if (signInResult.errors) {
			throw new Error(
				`Admin sign-in failed: ${JSON.stringify(signInResult.errors)}`,
			);
		}

		assertToBeNonNullish(signInResult.data?.signIn);
		assertToBeNonNullish(signInResult.data.signIn.authenticationToken);
		authToken = signInResult.data.signIn.authenticationToken;
	});

	it("should track mutation execution time when perf tracker is available", async () => {
		// Get initial snapshot count to verify new snapshot is created
		const initialSnapshots = server.getMetricsSnapshots?.(1) ?? [];

		// Create an organization to update
		const createResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: `Test Org ${faker.string.ulid()}`,
						description: "Test organization for update",
						countryCode: "us",
						state: "CA",
						city: "San Francisco",
						postalCode: "94101",
						addressLine1: "123 Test St",
					},
				},
			},
		);

		expect(createResult.errors).toBeUndefined();
		assertToBeNonNullish(createResult.data?.createOrganization);
		const orgId = createResult.data.createOrganization.id;

		// Update the organization
		const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: orgId,
					name: "Updated Organization Name",
					description: "Updated description",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.updateOrganization);
		expect(result.data.updateOrganization.id).toBe(orgId);
		expect(result.data.updateOrganization.name).toBe(
			"Updated Organization Name",
		);

		// Verify performance metrics were collected
		const snapshots = server.getMetricsSnapshots?.(1) ?? [];
		expect(snapshots.length).toBeGreaterThan(initialSnapshots.length);

		// Check the most recent snapshot for the mutation operation
		const latestSnapshot = snapshots[0];
		assertToBeNonNullish(latestSnapshot);
		const op = latestSnapshot.ops["mutation:updateOrganization"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
		expect(op?.ms).toBeGreaterThan(0);
	});

	it("should track metrics even when mutation fails", async () => {
		// Get initial snapshot count
		const initialSnapshots = server.getMetricsSnapshots?.(1) ?? [];

		// Try to update non-existent organization
		const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: faker.string.uuid(),
					name: "Non-existent Org",
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.data?.updateOrganization).toBeNull();

		// Verify error has proper structure
		expect(result.errors?.[0]?.extensions?.code).toBeDefined();

		// Verify performance metrics were still collected even on error
		const snapshots = server.getMetricsSnapshots?.(1) ?? [];
		expect(snapshots.length).toBeGreaterThan(initialSnapshots.length);

		// Verify the specific mutation:updateOrganization metric was recorded
		const latestSnapshot = snapshots[0];
		assertToBeNonNullish(latestSnapshot);
		const mutationOp = latestSnapshot.ops["mutation:updateOrganization"];
		expect(mutationOp).toBeDefined();
		expect(mutationOp?.count).toBeGreaterThanOrEqual(1);
	});

	it("should use correct operation name format", async () => {
		// Create an organization to update
		const createResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: `Test Org 2 ${faker.string.ulid()}`,
						description: "Test organization",
						countryCode: "us",
						state: "NY",
						city: "New York",
						postalCode: "10001",
						addressLine1: "456 Test Ave",
					},
				},
			},
		);

		assertToBeNonNullish(createResult.data?.createOrganization);
		const orgId = createResult.data.createOrganization.id;

		const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: orgId,
					name: "Updated Name",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.updateOrganization);

		// Verify operation name format
		const snapshots = server.getMetricsSnapshots?.(1) ?? [];
		const latestSnapshot = snapshots[0];
		assertToBeNonNullish(latestSnapshot);
		expect(latestSnapshot.ops).toHaveProperty("mutation:updateOrganization");
	});

	it("should track separate timing for validation vs database update", async () => {
		// Create an organization to update
		const createResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: `Validation Test Org ${faker.string.ulid()}`,
						description: "Organization for validation test",
						countryCode: "us",
						state: "TX",
						city: "Austin",
						postalCode: "78701",
						addressLine1: "789 Validation Blvd",
					},
				},
			},
		);

		assertToBeNonNullish(createResult.data?.createOrganization);
		const orgId = createResult.data.createOrganization.id;

		// Update the organization
		const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: orgId,
					name: "Validated and Updated Org",
					description: "Updated description",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.updateOrganization);

		// Verify performance metrics including sub-operations
		const snapshots = server.getMetricsSnapshots?.(1) ?? [];
		const latestSnapshot = snapshots[0];
		assertToBeNonNullish(latestSnapshot);
		const mainOp = latestSnapshot.ops["mutation:updateOrganization"];

		expect(mainOp).toBeDefined();
		expect(mainOp?.count).toBe(1);
		expect(mainOp?.ms).toBeGreaterThan(0);

		// Verify validation sub-operation was tracked
		const validationOp = latestSnapshot.ops.validation;
		expect(validationOp).toBeDefined();
		expect(validationOp?.count).toBe(1);
		expect(validationOp?.ms).toBeGreaterThan(0);

		// Verify database update sub-operation was tracked
		const dbUpdateOp = latestSnapshot.ops["db:organization-update"];
		expect(dbUpdateOp).toBeDefined();
		expect(dbUpdateOp?.count).toBe(1);
		expect(dbUpdateOp?.ms).toBeGreaterThan(0);
	});
});
