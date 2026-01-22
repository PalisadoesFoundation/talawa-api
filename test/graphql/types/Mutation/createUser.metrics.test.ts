import { faker } from "@faker-js/faker";
import { print } from "graphql";
import { beforeEach, describe, expect, it } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { Mutation_createUser, Query_signIn } from "../documentNodes";

/**
 * Test suite for createUser mutation performance tracking.
 * Verifies that performance metrics are properly collected for the createUser mutation
 * using end-to-end Mercurius integration tests.
 */
describe("createUser mutation performance tracking", () => {
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

		const result = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					emailAddress: `email${faker.string.ulid()}@email.com`,
					isEmailAddressVerified: false,
					name: "Test User",
					password: "password",
					role: "regular",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		assertToBeNonNullish(result.data?.createUser);
		expect(result.data.createUser.user?.id).toBeDefined();

		// Verify performance metrics were collected
		const snapshots = server.getMetricsSnapshots?.() ?? [];
		expect(snapshots.length).toBeGreaterThan(initialSnapshots.length);

		// Check the most recent snapshot for the mutation operation
		const latestSnapshot = snapshots[0];
		assertToBeNonNullish(latestSnapshot);
		const op = latestSnapshot.ops["mutation:createUser"];

		expect(op).toBeDefined();
		expect(op?.count).toBe(1);
		expect(op?.ms).toBeGreaterThanOrEqual(0);

		// Verify sub-operations
		const dbInsertOp = latestSnapshot.ops["db:user-insert"];
		expect(dbInsertOp).toBeDefined();
		expect(dbInsertOp?.count).toBe(1);

		const tokenStoreOp = latestSnapshot.ops["db:refresh-token-store"];
		expect(tokenStoreOp).toBeDefined();
		expect(tokenStoreOp?.count).toBe(1);
	});

	it("should track metrics even when mutation fails", async () => {
		// Get initial snapshot count
		const initialSnapshots = server.getMetricsSnapshots?.(1) ?? [];

		// First create a user
		const firstResult = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					emailAddress: `duplicate-test-${faker.string.ulid()}@example.com`,
					isEmailAddressVerified: false,
					name: "First User",
					password: "password",
					role: "regular",
				},
			},
		});

		expect(firstResult.errors).toBeUndefined();
		assertToBeNonNullish(firstResult.data?.createUser);
		assertToBeNonNullish(firstResult.data.createUser.user);
		assertToBeNonNullish(firstResult.data.createUser.user.emailAddress);

		// Try to create another user with the same email (will fail in resolver)
		const result = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					emailAddress: firstResult.data.createUser.user.emailAddress,
					isEmailAddressVerified: false,
					name: "Duplicate User",
					password: "password",
					role: "regular",
				},
			},
		});

		expect(result.errors).toBeDefined();
		expect(result.data?.createUser).toBeFalsy();

		// Verify performance metrics were still collected even on error
		const snapshots = server.getMetricsSnapshots?.(1) ?? [];
		expect(snapshots.length).toBeGreaterThan(initialSnapshots.length);

		// Verify the specific mutation:createUser metric was recorded
		const latestSnapshot = snapshots[0];
		assertToBeNonNullish(latestSnapshot);
		const mutationOp = latestSnapshot.ops["mutation:createUser"];
		expect(mutationOp).toBeDefined();
		expect(mutationOp?.count).toBeGreaterThanOrEqual(1);
	});

	it("should track sub-operation metrics including avatar upload", async () => {
		const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;
		const operations = JSON.stringify({
			query: print(Mutation_createUser),
			variables: {
				input: {
					emailAddress: `email${faker.string.ulid()}@email.com`,
					isEmailAddressVerified: false,
					name: "Test User with Avatar",
					password: "password",
					role: "regular",
					avatar: null,
				},
			},
		});

		const map = JSON.stringify({
			"0": ["variables.input.avatar"],
		});

		const fileContent = "fake png content";

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
			'Content-Disposition: form-data; name="0"; filename="avatar.png"',
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
		assertToBeNonNullish(result.data?.createUser);

		// Verify performance metrics including sub-operations
		const snapshots = server.getMetricsSnapshots?.() ?? [];
		const latestSnapshot = snapshots[snapshots.length - 1];
		assertToBeNonNullish(latestSnapshot);

		const mainOp = latestSnapshot.ops["mutation:createUser"];
		expect(mainOp).toBeDefined();

		// Verify avatar upload sub-operation was tracked
		const avatarUploadOp = latestSnapshot.ops["file:avatar-upload"];
		expect(avatarUploadOp).toBeDefined();
		expect(avatarUploadOp?.count).toBe(1);
	});
});
