import { faker } from "@faker-js/faker";
import { print } from "graphql";
import { beforeEach, describe, expect, it } from "vitest";
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

	it("should track mutation execution time when perf tracker is available", async () => {
		// Get initial snapshot count to verify new snapshot is created
		const initialSnapshots = server.getMetricsSnapshots?.() ?? [];

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
		const snapshots = server.getMetricsSnapshots?.() ?? [];
		expect(snapshots.length).toBeGreaterThan(initialSnapshots.length);

		// Check the most recent snapshot for the mutation operation
		const latestSnapshot = snapshots.find(
			(s) => s.ops["mutation:createOrganization"] !== undefined,
		);
		assertToBeNonNullish(latestSnapshot);
		const op = latestSnapshot.ops["mutation:createOrganization"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
		expect(op?.ms).toBeGreaterThanOrEqual(0);
	});

	it("should track metrics even when mutation fails", async () => {
		// Get initial snapshot count
		const initialSnapshots = server.getMetricsSnapshots?.() ?? [];

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
		const snapshots = server.getMetricsSnapshots?.() ?? [];
		expect(snapshots.length).toBeGreaterThan(initialSnapshots.length);

		// Verify the specific mutation metric is present
		const latestSnapshot = snapshots.find(
			(s) => s.ops?.["mutation:createOrganization"],
		);
		assertToBeNonNullish(latestSnapshot);
		expect(latestSnapshot.ops["mutation:createOrganization"]).toBeDefined();
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
		const snapshots = server.getMetricsSnapshots?.() ?? [];
		const latestSnapshot = snapshots.find(
			(s) => s.ops?.["mutation:createOrganization"],
		);
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
		const snapshots = server.getMetricsSnapshots?.() ?? [];
		const latestSnapshot = snapshots.find(
			(s) => s.ops["mutation:createOrganization"] !== undefined,
		);
		assertToBeNonNullish(latestSnapshot);
		const op = latestSnapshot.ops["mutation:createOrganization"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
		expect(op?.ms).toBeGreaterThanOrEqual(0);

		// Verify database insert sub-operation was tracked
		const dbInsertOp = latestSnapshot.ops["db:organization-insert"];
		expect(dbInsertOp).toBeDefined();
		expect(dbInsertOp?.count).toBe(1);
		expect(dbInsertOp?.ms).toBeGreaterThanOrEqual(0);
	});

	it("should track sub-operation metrics including avatar upload", async () => {
		const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;
		const operations = JSON.stringify({
			query: print(Mutation_createOrganization),
			variables: {
				input: {
					name: `Avatar Org ${faker.string.ulid()}`,
					description: "Organization with avatar",
					countryCode: "us",
					state: "CA",
					city: "San Francisco",
					postalCode: "94101",
					addressLine1: "123 Avatar St",
					avatar: null,
				},
			},
		});

		const map = JSON.stringify({
			"0": ["variables.input.avatar"],
		});

		// Minimal valid 1x1 transparent PNG (signature + IHDR + IDAT + IEND chunks)
		const fileContent = Buffer.from([
			// PNG signature
			0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
			// IHDR chunk (13 bytes): width=1, height=1, bit depth=8, color type=6 (RGBA)
			0x00,
			0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00,
			0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89,
			// IDAT chunk (minimal compressed data for 1x1 transparent pixel)
			0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00,
			0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4,
			// IEND chunk
			0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
		]);

		const body = [
			`--${boundary}`,
			'Content-Disposition: form-data; name="operations"',
			"",
			operations,
			`--${boundary}`,
			'Content-Disposition: form-data; name="map"',
			"",
			map,
			`--${boundary}`,
			'Content-Disposition: form-data; name="0"; filename="org-avatar.png"',
			"Content-Type: image/png",
			"",
			fileContent,
			`--${boundary}--`,
		].join("\r\n");

		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			headers: {
				"content-type": `multipart/form-data; boundary=${boundary}`,
				authorization: `bearer ${authToken}`,
			},
			payload: body,
		});

		const result = JSON.parse(response.body);
		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.createOrganization);
		expect(result.data.createOrganization.id).toBeDefined();

		// Verify performance metrics including sub-operations
		const snapshots = server.getMetricsSnapshots?.() ?? [];
		const latestSnapshot = snapshots.find(
			(s) => s.ops["mutation:createOrganization"] !== undefined,
		);
		assertToBeNonNullish(latestSnapshot);
		const mainOp = latestSnapshot.ops["mutation:createOrganization"];

		expect(mainOp).toBeDefined();
		expect(mainOp?.count).toBe(1);
		expect(mainOp?.ms).toBeGreaterThanOrEqual(0);

		// Verify database insert sub-operation was tracked
		const dbInsertOp = latestSnapshot.ops["db:organization-insert"];
		expect(dbInsertOp).toBeDefined();
		expect(dbInsertOp?.count).toBe(1);
		expect(dbInsertOp?.ms).toBeGreaterThanOrEqual(0);

		// Verify avatar upload sub-operation was tracked
		const avatarUploadOp = latestSnapshot.ops["file:avatar-upload"];
		expect(avatarUploadOp).toBeDefined();
		expect(avatarUploadOp?.count).toBe(1);
		expect(avatarUploadOp?.ms).toBeGreaterThanOrEqual(0);
	});

	it("should track metrics when mutation fails due to authentication", async () => {
		const initialSnapshots = server.getMetricsSnapshots?.() ?? [];

		// Simulate authentication failure by not providing token
		const result = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: "" },
			variables: {
				input: {
					name: "Unauthorized Org",
					countryCode: "us",
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.data?.createOrganization).toBeNull();

		const snapshots = server.getMetricsSnapshots?.() ?? [];
		expect(snapshots.length).toBeGreaterThan(initialSnapshots.length);

		// Find the snapshot that contains our mutation operation
		const latestSnapshot = snapshots.find(
			(s) => s.ops["mutation:createOrganization"] !== undefined,
		);
		assertToBeNonNullish(latestSnapshot);
		const op = latestSnapshot.ops["mutation:createOrganization"];

		expect(op).toBeDefined();
		expect(op?.count).toBeGreaterThanOrEqual(1);
	});
});
