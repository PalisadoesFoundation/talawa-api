import { faker } from "@faker-js/faker";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { Mutation_createOrganization, Query_signIn } from "../documentNodes";

/**
 * Test suite for createOrganization mutation performance tracking.
 * Verifies that performance metrics are properly collected for the createOrganization mutation
 * using end-to-end Mercurius integration tests.
 */
describe("createOrganization mutation performance tracking", () => {
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

	afterEach(() => {
		// Clear any test state if needed
	});

	it("should track mutation execution time when perf tracker is available", async () => {
		// Get initial snapshot count to verify new snapshot is created
		const initialSnapshots = server.getMetricsSnapshots?.(1) ?? [];

		const result = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: `Test Org ${faker.string.ulid()}`,
					description: "Test organization for metrics",
					countryCode: "us",
					state: "CA",
					city: "San Francisco",
					postalCode: "94101",
					addressLine1: "123 Test St",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.createOrganization);
		expect(result.data.createOrganization.id).toBeDefined();
		expect(result.data.createOrganization.name).toBeDefined();

		// Verify performance metrics were collected
		const snapshots = server.getMetricsSnapshots?.(1) ?? [];
		expect(snapshots.length).toBeGreaterThan(initialSnapshots.length);

		// Check the most recent snapshot for the mutation operation
		const latestSnapshot = snapshots[0];
		assertToBeNonNullish(latestSnapshot);
		const op = latestSnapshot.ops["mutation:createOrganization"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
		expect(op?.ms).toBeGreaterThanOrEqual(0);
	});

	it("should track metrics even when mutation fails", async () => {
		// Get initial snapshot count
		const initialSnapshots = server.getMetricsSnapshots?.(1) ?? [];

		// Use invalid input to cause validation error
		const result = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: "", // Invalid: empty name
					description: "Test",
					countryCode: "us",
					state: "CA",
					city: "San Francisco",
					postalCode: "94101",
					addressLine1: "123 Test St",
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.data?.createOrganization).toBeNull();

		// Verify error has proper structure
		expect(result.errors?.[0]?.extensions?.code).toBeDefined();

		// Verify performance metrics were still collected even on error
		const snapshots = server.getMetricsSnapshots?.(1) ?? [];
		expect(snapshots.length).toBeGreaterThan(initialSnapshots.length);
	});

	it("should use correct operation name format", async () => {
		const result = await mercuriusClient.mutate(Mutation_createOrganization, {
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
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.createOrganization);
		expect(result.data.createOrganization.id).toBeDefined();

		// Verify operation name format
		const snapshots = server.getMetricsSnapshots?.(1) ?? [];
		const latestSnapshot = snapshots[0];
		assertToBeNonNullish(latestSnapshot);
		expect(latestSnapshot.ops).toHaveProperty("mutation:createOrganization");
	});

	it("should track complex mutation execution timing", async () => {
		const result = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: `Complex Org ${faker.string.ulid()}`,
					description: "Complex organization with all fields",
					countryCode: "us",
					state: "TX",
					city: "Austin",
					postalCode: "78701",
					addressLine1: "789 Complex Blvd",
					addressLine2: "Suite 100",
					isUserRegistrationRequired: true,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.createOrganization);
		expect(result.data.createOrganization.id).toBeDefined();
		expect(result.data.createOrganization.isUserRegistrationRequired).toBe(
			true,
		);

		// Verify metrics were collected for complex operation
		const snapshots = server.getMetricsSnapshots?.(1) ?? [];
		const latestSnapshot = snapshots[0];
		assertToBeNonNullish(latestSnapshot);
		const op = latestSnapshot.ops["mutation:createOrganization"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
		expect(op?.ms).toBeGreaterThanOrEqual(0);
	});
});
