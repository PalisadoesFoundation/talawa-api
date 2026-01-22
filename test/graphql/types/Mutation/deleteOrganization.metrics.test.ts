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

/**
 * Test suite for deleteOrganization mutation performance tracking.
 * Verifies that performance metrics are properly collected for the deleteOrganization mutation
 * using end-to-end Mercurius integration tests.
 */
describe("deleteOrganization mutation performance tracking", () => {
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
		// Create an organization to delete
		const createResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: `Test Org ${faker.string.ulid()}`,
						description: "Test organization for deletion",
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

		const initialSnapshots = server.getMetricsSnapshots?.() ?? [];

		// Delete the organization
		const result = await mercuriusClient.mutate(Mutation_deleteOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: orgId,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.deleteOrganization);
		expect(result.data.deleteOrganization.id).toBe(orgId);

		// Verify performance metrics were collected
		const snapshots = server.getMetricsSnapshots?.() ?? [];
		expect(snapshots.length).toBeGreaterThan(initialSnapshots.length);

		// Find the snapshot containing the mutation metric (new snapshots are prepended)
		const latestSnapshot = snapshots.find(
			(s) => s.ops["mutation:deleteOrganization"] !== undefined,
		);
		assertToBeNonNullish(latestSnapshot);
		const op = latestSnapshot.ops["mutation:deleteOrganization"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
		expect(op?.ms).toBeGreaterThan(0);
	});

	it("should track metrics even when mutation fails", async () => {
		// Get initial snapshot count
		const initialSnapshots = server.getMetricsSnapshots?.() ?? [];

		// Try to delete non-existent organization
		const result = await mercuriusClient.mutate(Mutation_deleteOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: faker.string.uuid(),
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.data?.deleteOrganization).toBeNull();

		// Verify error has proper structure
		expect(result.errors?.[0]?.extensions?.code).toBeDefined();

		// Verify performance metrics were still collected even on error
		const snapshots = server.getMetricsSnapshots?.() ?? [];
		expect(snapshots.length).toBeGreaterThan(initialSnapshots.length);

		// Find the snapshot containing the mutation metric (new snapshots are prepended)
		const latestSnapshot = snapshots.find(
			(s) => s.ops["mutation:deleteOrganization"] !== undefined,
		);
		assertToBeNonNullish(latestSnapshot);
		expect(latestSnapshot.ops["mutation:deleteOrganization"]).toBeDefined();
	});

	it("should track metrics even when authentication/authorization fails", async () => {
		// Create an organization to delete
		const createResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: `Unauthorized Delete Org ${faker.string.ulid()}`,
						description: "Organization for unauthorized deletion test",
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

		// Get initial snapshot count
		const initialSnapshots = server.getMetricsSnapshots?.() ?? [];

		// Call mutation without authorization header
		const result = await mercuriusClient.mutate(Mutation_deleteOrganization, {
			variables: {
				input: {
					id: orgId,
				},
			},
		});

		// Verify response contains errors and deleteOrganization is null
		expect(result.errors).toBeDefined();
		expect(result.data?.deleteOrganization).toBeNull();

		// Verify error has proper structure
		expect(result.errors?.[0]?.extensions?.code).toBeDefined();

		// Verify server.getMetricsSnapshots still increases
		const snapshots = server.getMetricsSnapshots?.() ?? [];
		expect(snapshots.length).toBeGreaterThan(initialSnapshots.length);

		// Find the snapshot containing the mutation metric (new snapshots are prepended)
		const latestSnapshot = snapshots.find(
			(s) => s.ops["mutation:deleteOrganization"] !== undefined,
		);
		assertToBeNonNullish(latestSnapshot);
		const op = latestSnapshot.ops["mutation:deleteOrganization"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
	});

	it("should use correct operation name format", async () => {
		// Create an organization to delete
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

		const result = await mercuriusClient.mutate(Mutation_deleteOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: orgId,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.deleteOrganization);

		// Verify operation name format
		const snapshots = server.getMetricsSnapshots?.() ?? [];
		// Find the snapshot containing the mutation metric (new snapshots are prepended)
		const latestSnapshot = snapshots.find(
			(s) => s.ops["mutation:deleteOrganization"] !== undefined,
		);
		assertToBeNonNullish(latestSnapshot);
		expect(latestSnapshot.ops).toHaveProperty("mutation:deleteOrganization");
	});

	it("should track cascade deletion timing", async () => {
		// Create an organization to delete
		const createResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: `Cascade Test Org ${faker.string.ulid()}`,
						description: "Organization for cascade deletion test",
						countryCode: "us",
						state: "TX",
						city: "Austin",
						postalCode: "78701",
						addressLine1: "789 Cascade Blvd",
					},
				},
			},
		);

		assertToBeNonNullish(createResult.data?.createOrganization);
		const orgId = createResult.data.createOrganization.id;

		// Delete the organization
		const result = await mercuriusClient.mutate(Mutation_deleteOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: orgId,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.deleteOrganization);

		// Verify performance metrics including sub-operations
		const snapshots = server.getMetricsSnapshots?.() ?? [];
		// Find the snapshot containing the mutation metric (new snapshots are prepended)
		const latestSnapshot = snapshots.find(
			(s) => s.ops["mutation:deleteOrganization"] !== undefined,
		);
		assertToBeNonNullish(latestSnapshot);
		const mainOp = latestSnapshot.ops["mutation:deleteOrganization"];

		expect(mainOp).toBeDefined();
		expect(mainOp?.count).toBe(1);
		expect(mainOp?.ms).toBeGreaterThan(0);

		// Verify cascade deletion sub-operation was tracked
		const cascadeOp = latestSnapshot.ops["db:cascade-deletion"];
		expect(cascadeOp).toBeDefined();
		expect(cascadeOp?.count).toBe(1);
		expect(cascadeOp?.ms).toBeGreaterThan(0);
	});

	it("should track cleanup operations timing", async () => {
		// Create an organization with attachments to trigger cleanup
		const createResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: `Cleanup Test Org ${faker.string.ulid()}`,
						description: "Organization for cleanup test",
						countryCode: "us",
						state: "FL",
						city: "Miami",
						postalCode: "33101",
						addressLine1: "321 Cleanup St",
					},
				},
			},
		);

		assertToBeNonNullish(createResult.data?.createOrganization);
		const orgId = createResult.data.createOrganization.id;

		// Delete the organization (cleanup will be triggered even if no files exist)
		const result = await mercuriusClient.mutate(Mutation_deleteOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: orgId,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.deleteOrganization);

		// Verify performance metrics including sub-operations
		const snapshots = server.getMetricsSnapshots?.() ?? [];
		// Find the snapshot containing the mutation metric (new snapshots are prepended)
		const latestSnapshot = snapshots.find(
			(s) => s.ops["mutation:deleteOrganization"] !== undefined,
		);
		assertToBeNonNullish(latestSnapshot);
		const mainOp = latestSnapshot.ops["mutation:deleteOrganization"];

		expect(mainOp).toBeDefined();
		expect(mainOp?.count).toBe(1);
		expect(mainOp?.ms).toBeGreaterThan(0);

		// Verify cleanup sub-operation was tracked
		const cleanupOp = latestSnapshot.ops["cleanup:file-removal"];
		expect(cleanupOp).toBeDefined();
		expect(cleanupOp?.count).toBe(1);
		expect(cleanupOp?.ms).toBeGreaterThan(0);
	});
});
