import { afterEach, expect, suite, test, vi } from "vitest";
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
					// Intentional type cast: `as "us"` bypasses TypeScript's compile-time enum check
					// so this test can exercise the runtime GraphQL validation layer of the
					// Mutation_createOrganization countryCode field with an invalid ISO 3166-1 alpha-2 code.
					countryCode: "xx" as "us",
				},
			},
		});

		// Invalid countryCode should result in no organization being created
		// GraphQL validation errors may return undefined rather than null
		expect(result.data?.createOrganization ?? null).toBeNull();
		// Should have errors
		expect(result.errors).toBeDefined();
		expect(result.errors?.length).toBeGreaterThan(0);
		// Verify error structure - invalid enum values are caught at GraphQL validation layer
		// which returns a different structure than resolver-level validation (invalid_arguments)
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
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
		// Cache invalidation is unit-tested in test/services/caching/invalidation.test.ts (invalidateEntity, invalidateEntityLists)
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

	test("should return an error with unexpected extensions code when DB insert returns undefined", async () => {
		// Mock the transaction to simulate the DB insert returning an empty array (undefined organization)
		const originalTransaction = server.drizzleClient.transaction;
		server.drizzleClient.transaction = vi
			.fn()
			.mockImplementation(async (callback) => {
				// Create a mock transaction object with an insert method that returns empty array
				const mockTx = {
					insert: () => ({
						values: () => ({
							returning: async () => [],
						}),
					}),
				};

				// Call the callback with our mock transaction
				return await callback(mockTx);
			});

		try {
			const result = await mercuriusClient.mutate(Mutation_createOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: `DB Error Test Org ${Date.now()}`,
						countryCode: "us",
					},
				},
			});

			expect(result.data?.createOrganization).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unexpected",
						}),
						path: ["createOrganization"],
					}),
				]),
			);
		} finally {
			// Restore the original function
			server.drizzleClient.transaction = originalTransaction;
		}
	});

	suite("schema string length boundary tests", () => {
		// Schema constraints from organizations.ts:
		// name: min(1).max(256)
		// description: min(1).max(2048)
		const NAME_MAX_LENGTH = 256;
		const DESCRIPTION_MAX_LENGTH = 2048;

		test("should accept organization name at exactly max length (256)", async () => {
			const maxLengthName = "a".repeat(NAME_MAX_LENGTH);

			const result = await mercuriusClient.mutate(Mutation_createOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: maxLengthName,
						countryCode: "us",
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createOrganization).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: maxLengthName,
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

		test("should reject organization name exceeding max length (256)", async () => {
			const overLengthName = "a".repeat(NAME_MAX_LENGTH + 1);

			const result = await mercuriusClient.mutate(Mutation_createOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: overLengthName,
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

		test("should accept organization description at exactly max length (2048)", async () => {
			const maxLengthDescription = "a".repeat(DESCRIPTION_MAX_LENGTH);
			const orgName = `Desc Max Length Org ${Date.now()}`;

			const result = await mercuriusClient.mutate(Mutation_createOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: orgName,
						description: maxLengthDescription,
						countryCode: "us",
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createOrganization).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: orgName,
					description: maxLengthDescription,
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

		test("should reject organization description exceeding max length (2048)", async () => {
			const overLengthDescription = "a".repeat(DESCRIPTION_MAX_LENGTH + 1);

			const result = await mercuriusClient.mutate(Mutation_createOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: `Over Desc Org ${Date.now()}`,
						description: overLengthDescription,
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
	});

	test("should return an error when MinIO upload fails during avatar upload", async () => {
		// Save original method for restoration
		const originalPutObject = server.minio.client.putObject;

		try {
			// Mock MinIO failure
			server.minio.client.putObject = vi
				.fn()
				.mockRejectedValue(new Error("simulated MinIO failure"));

			const orgName = `MinIO Fail Test Org ${Date.now()}`;
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

			// MinIO failure should result in no organization being created
			expect(result.data?.createOrganization).toBeNull();
			// Should have an error - the transaction should rollback on MinIO failure
			expect(result.errors).toBeDefined();
			expect(result.errors?.length).toBeGreaterThan(0);
			// Verify the error has an extensions object (error structure may vary)
			// The error could be 'unexpected' when MinIO failure propagates as an unhandled exception
			// or it could surface differently depending on how the transaction handles the error
			expect(result.errors[0].extensions).toBeDefined();
			// The error should either be 'unexpected' (from explicit throw) or have a correlation ID
			// indicating it was properly tracked by the error handling system
			const errorCode = result.errors[0].extensions?.code;
			expect(
				errorCode === "unexpected" ||
					result.errors[0].extensions?.correlationId,
			).toBeTruthy();
		} finally {
			// Restore original method
			server.minio.client.putObject = originalPutObject;
		}
	});
});
