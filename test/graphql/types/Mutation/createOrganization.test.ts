import { afterEach, expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
} from "../documentNodes";

const signInResult = await mercuriusClient.query(
	`query Query_signIn($input: QuerySignInInput!) {
		signIn(input: $input) {
			authenticationToken
		}
	}`,
	{
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	},
);
assertToBeNonNullish(signInResult.data?.signIn);
const authToken = signInResult.data.signIn.authenticationToken;
assertToBeNonNullish(authToken);

suite("Mutation field createOrganization", () => {
	const testCleanupFunctions: Array<() => Promise<void>> = [];

	afterEach(async () => {
		let firstError: unknown;
		while (testCleanupFunctions.length > 0) {
			const cleanup = testCleanupFunctions.pop();
			if (!cleanup) {
				continue;
			}

			try {
				await cleanup();
			} catch (error) {
				console.error("Cleanup failed:", error);
				firstError ??= error;
			}
		}

		if (firstError !== undefined) {
			throw firstError;
		}
	});

	test("should return an error with unauthenticated extensions code when no auth token provided", async () => {
		const result = await mercuriusClient.mutate(Mutation_createOrganization, {
			variables: {
				input: {
					name: "Unauthenticated Test Org",
					countryCode: "us",
				},
			},
		});

		expect(result.data?.createOrganization).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
					path: ["createOrganization"],
				}),
			]),
		);
	});

	test("should return an error with unauthorized_action extensions code when non-admin user creates organization", async () => {
		const { authToken: regularAuthToken, userId: regularUserId } =
			await createRegularUserUsingAdmin();
		assertToBeNonNullish(regularAuthToken);
		assertToBeNonNullish(regularUserId);

		// Add cleanup for the regular user
		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: regularUserId } },
			});
		});

		const result = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${regularAuthToken}` },
			variables: {
				input: {
					name: "Regular User Test Org",
					countryCode: "us",
				},
			},
		});

		expect(result.data?.createOrganization).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthorized_action",
					}),
					path: ["createOrganization"],
				}),
			]),
		);
	});

	test("should successfully create an organization with required fields", async () => {
		const orgName = `Test Org ${Date.now()}`;

		const result = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: orgName,
					countryCode: "us",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.createOrganization).toEqual(
			expect.objectContaining({
				id: expect.any(String),
				name: orgName,
				countryCode: "us",
			}),
		);

		const orgId = result.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// Add cleanup
		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: orgId } },
			});
		});
	});

	test("should successfully create an organization with all optional fields", async () => {
		const orgName = `Full Test Org ${Date.now()}`;

		const result = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: orgName,
					description: "A test organization with all fields",
					countryCode: "us",
					state: "CA",
					city: "San Francisco",
					postalCode: "94101",
					addressLine1: "123 Test Street",
					addressLine2: "Suite 100",
					isUserRegistrationRequired: true,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.createOrganization).toEqual(
			expect.objectContaining({
				id: expect.any(String),
				name: orgName,
				description: "A test organization with all fields",
				countryCode: "us",
				state: "CA",
				city: "San Francisco",
				postalCode: "94101",
				addressLine1: "123 Test Street",
				addressLine2: "Suite 100",
				isUserRegistrationRequired: true,
			}),
		);

		const orgId = result.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// Add cleanup
		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: orgId } },
			});
		});
	});

	test("should create organization with isUserRegistrationRequired set to false by default", async () => {
		const orgName = `Default Registration Org ${Date.now()}`;

		const result = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: orgName,
					countryCode: "us",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.createOrganization?.isUserRegistrationRequired).toBe(
			false,
		);

		const orgId = result.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// Add cleanup
		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: orgId } },
			});
		});
	});

	test("should return an error when organization name already exists", async () => {
		const orgName = `Duplicate Test Org ${Date.now()}`;

		// Create first organization
		const createResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: orgName,
						countryCode: "us",
					},
				},
			},
		);

		expect(createResult.errors).toBeUndefined();
		const orgId = createResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// Add cleanup for first organization
		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: orgId } },
			});
		});

		// Try to create second organization with same name
		const duplicateResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: orgName,
						countryCode: "us",
					},
				},
			},
		);

		expect(duplicateResult.data?.createOrganization).toBeNull();
		expect(duplicateResult.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "forbidden_action_on_arguments_associated_resources",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "name"],
								message: "This name is not available.",
							}),
						]),
					}),
					path: ["createOrganization"],
				}),
			]),
		);
	});

	test("should return an error for empty organization name", async () => {
		const result = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: "",
					countryCode: "us",
				},
			},
		});

		expect(result.data?.createOrganization).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
					}),
					path: ["createOrganization"],
				}),
			]),
		);
	});

	test("should return an error for invalid countryCode (non-ISO 3166-1 alpha-2)", async () => {
		const result = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: `Valid Org Name ${Date.now()}`,
					// Using type assertion to test invalid value that TypeScript wouldn't normally allow
					countryCode: "xx" as "us",
				},
			},
		});

		// Invalid countryCode should result in no organization being created
		expect(result.data?.createOrganization).toBeFalsy();
		// Should have errors
		expect(result.errors).toBeDefined();
		expect(result.errors?.length).toBeGreaterThan(0);
		// Verify error structure - invalid enum values are caught at GraphQL validation layer
		// The error message indicates validation failed for the countryCode field
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					message: expect.stringContaining("validation error"),
					extensions: expect.objectContaining({
						correlationId: expect.any(String),
					}),
				}),
			]),
		);
	});

	test("should successfully complete mutation with cache invalidation (implicit test)", async () => {
		// This test verifies that the mutation completes successfully,
		// which implicitly exercises the cache invalidation path in the resolver.
		// If cache invalidation failed and wasn't handled gracefully, the mutation would error.
		// Cache invalidation is unit-tested in test/graphql/types/Mutation/*Unit.test.ts (invalidateEntity, invalidateEntityLists)
		const orgName = `Cache Test Org ${Date.now()}`;

		const result = await mercuriusClient.mutate(Mutation_createOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					name: orgName,
					countryCode: "us",
					description: "Testing cache invalidation path",
				},
			},
		});

		// Mutation should succeed - cache invalidation is non-blocking
		expect(result.errors).toBeUndefined();
		expect(result.data?.createOrganization).toBeDefined();
		expect(result.data?.createOrganization?.name).toBe(orgName);

		const orgId = result.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// Add cleanup
		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: orgId } },
			});
		});
	});

	test("should successfully create organization with valid avatar (MIME type validated and processed)", async () => {
		const orgName = `Avatar Test Org ${Date.now()}`;
		const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;

		const operations = JSON.stringify({
			query: `
			mutation Mutation_createOrganization($input: MutationCreateOrganizationInput!) {
				createOrganization(input: $input) {
					id
					name
					countryCode
					avatarMimeType
					avatarURL
				}
			}
			`,
			variables: {
				input: {
					name: orgName,
					countryCode: "us",
					avatar: null, // placeholder for map
				},
			},
		});

		const map = JSON.stringify({
			"0": ["variables.input.avatar"],
		});

		const fileContent = "test image content";

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
			'Content-Disposition: form-data; name="0"; filename="test.png"',
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
		expect(result.data?.createOrganization).toEqual(
			expect.objectContaining({
				id: expect.any(String),
				name: orgName,
				countryCode: "us",
				avatarMimeType: "image/png",
				avatarURL: expect.stringContaining("/objects/"),
			}),
		);

		const orgId = result.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// Add cleanup
		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: orgId } },
			});
		});
	});

	test("should return invalid_arguments error for invalid avatar MIME type", async () => {
		const orgName = `Invalid Avatar Org ${Date.now()}`;
		const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;

		const operations = JSON.stringify({
			query: `
			mutation Mutation_createOrganization($input: MutationCreateOrganizationInput!) {
				createOrganization(input: $input) {
					id
					name
					avatarMimeType
				}
			}
			`,
			variables: {
				input: {
					name: orgName,
					countryCode: "us",
					avatar: null, // placeholder for map
				},
			},
		});

		const map = JSON.stringify({
			"0": ["variables.input.avatar"],
		});

		const fileContent = "fake text content";

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
			'Content-Disposition: form-data; name="0"; filename="test.txt"',
			"Content-Type: text/plain", // Invalid MIME type for avatar
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

		// Invalid avatar MIME type should result in no organization being created
		expect(result.data?.createOrganization).toBeNull();
		// Should have errors with invalid_arguments code
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "avatar"],
								message: expect.stringContaining("text/plain"),
							}),
						]),
					}),
					path: ["createOrganization"],
				}),
			]),
		);
	});
});
