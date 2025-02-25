import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, expect, suite, test } from "vitest";
import { usersTable } from "~/src/drizzle/schema";
import { agendaItemsTableInsertSchema } from "~/src/drizzle/tables/agendaItems";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createAgendaFolder,
	Mutation_createAgendaItem,
	Mutation_createEvent,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteAgendaItem,
	Mutation_deleteEvent,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
	Query_agendaItem,
	Query_signIn,
} from "../documentNodes";

/**
 * Helper function to get admin auth token with proper error handling
 * @throws {Error} If admin credentials are invalid or missing
 * @returns {Promise<string>} Admin authentication token
 */
let cachedAdminToken: string | null = null;
async function getAdminAuthToken(): Promise<string> {
	if (cachedAdminToken) {
		return cachedAdminToken;
	}

	try {
		// Check if admin credentials exist
		if (
			!server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS ||
			!server.envConfig.API_ADMINISTRATOR_USER_PASSWORD
		) {
			throw new Error(
				"Admin credentials are missing in environment configuration",
			);
		}
		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		// Check for GraphQL errors
		if (adminSignInResult.errors) {
			throw new Error(
				`Admin authentication failed: ${adminSignInResult.errors[0]?.message || "Unknown error"}`,
			);
		}
		// Check for missing data
		if (!adminSignInResult.data?.signIn?.authenticationToken) {
			throw new Error(
				"Admin authentication succeeded but no token was returned",
			);
		}
		cachedAdminToken = adminSignInResult.data.signIn.authenticationToken;
		return cachedAdminToken;
	} catch (error) {
		// Wrap and rethrow with more context
		throw new Error(
			`Failed to get admin authentication token: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

suite("Query field agendaItem", () => {
	suite("Authentication Tests", () => {
		test("returns error if client is not authenticated", async () => {
			const agendaItemResult = await mercuriusClient.query(Query_agendaItem, {
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			});

			expect(agendaItemResult.data.agendaItem).toEqual(null);
			expect(agendaItemResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["agendaItem"],
					}),
				]),
			);
		});

		test("returns error with invalid authentication token", async () => {
			// Generate a random invalid token
			const invalidToken = Buffer.from(faker.string.alphanumeric(32)).toString(
				"base64",
			);

			const agendaItemResult = await mercuriusClient.query(Query_agendaItem, {
				headers: {
					authorization: `bearer ${invalidToken}`,
				},
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			});

			expect(agendaItemResult.data.agendaItem).toEqual(null);
			expect(agendaItemResult.errors?.[0]?.extensions?.code).toBe(
				"unauthenticated",
			);
		});

		test("returns error if user exists in token but not in database", async () => {
			// First create a user and get their token
			const regularUserResult = await createRegularUser();

			// Delete the user from database while their token is still valid
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, regularUserResult.userId));

			// Try to query using the token of deleted user
			const agendaItemResult = await mercuriusClient.query(Query_agendaItem, {
				headers: {
					authorization: `bearer ${regularUserResult.authToken}`,
				},
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			});

			expect(agendaItemResult.data.agendaItem).toEqual(null);
			expect(agendaItemResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["agendaItem"],
					}),
				]),
			);
		});
	});

	suite("Resource Validation Tests", () => {
		test("returns error if agenda item doesn't exist", async () => {
			const adminAuthToken = await getAdminAuthToken();
			const nonExistentId = faker.string.uuid();

			const agendaItemResult = await mercuriusClient.query(Query_agendaItem, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						id: nonExistentId,
					},
				},
			});

			expect(agendaItemResult.data.agendaItem).toEqual(null);
			expect(agendaItemResult.errors?.[0]?.extensions?.code).toBe(
				"arguments_associated_resources_not_found",
			);
		});
	});
});

suite("Schema Validation Tests", () => {
	test("validates agenda item name constraints", () => {
		const validInput = {
			name: "Test Agenda Item",
			type: "general",
			folderId: faker.string.uuid(),
		};

		// Test empty name
		expect(
			agendaItemsTableInsertSchema.safeParse({
				...validInput,
				name: "",
			}).success,
		).toBe(false);

		// Test too long name
		expect(
			agendaItemsTableInsertSchema.safeParse({
				...validInput,
				name: "a".repeat(257),
			}).success,
		).toBe(false);

		// Test valid name
		expect(agendaItemsTableInsertSchema.safeParse(validInput).success).toBe(
			true,
		);
	});

	test("validates description field constraints", () => {
		const validInput = {
			name: "Test Agenda Item",
			type: "general",
			folderId: faker.string.uuid(),
		};

		// Test too long description
		expect(
			agendaItemsTableInsertSchema.safeParse({
				...validInput,
				description: "a".repeat(2049),
			}).success,
		).toBe(false);

		// Test valid description
		expect(
			agendaItemsTableInsertSchema.safeParse({
				...validInput,
				description: "Valid description",
			}).success,
		).toBe(true);

		// Test optional description
		expect(
			agendaItemsTableInsertSchema.safeParse({
				...validInput,
				description: undefined,
			}).success,
		).toBe(true);
	});

	test("validates required fields", () => {
		// Test missing name
		expect(
			agendaItemsTableInsertSchema.safeParse({
				type: "general",
				folderId: faker.string.uuid(),
			}).success,
		).toBe(false);

		// Test missing type
		expect(
			agendaItemsTableInsertSchema.safeParse({
				name: "Test Item",
				folderId: faker.string.uuid(),
			}).success,
		).toBe(false);

		// Test missing folderId
		expect(
			agendaItemsTableInsertSchema.safeParse({
				name: "Test Item",
				type: "general",
			}).success,
		).toBe(false);
	});
});

// Helper Types
interface TestUser {
	authToken: string;
	userId: string;
	cleanup: () => Promise<void>;
}

interface TestAgendaItem {
	agendaItemId: string;
	orgId: string;
	eventId: string;
	folderId: string;
	cleanup: () => Promise<void>;
}

interface TokenPayload {
	exp: number;
	iat: number;
	sub: string;
	jti?: string;
	iss?: string;
}

// Helper Functions
/**
 * Creates test tokens with proper JWT structure
 * Simulates real JWT format without needing external library
 */
function createTestToken(payload: Partial<TokenPayload> = {}): string {
	const header = {
		alg: "HS256",
		typ: "JWT",
	};

	const defaultPayload = {
		iat: Math.floor(Date.now() / 1000),
		sub: faker.string.uuid(),
		jti: faker.string.uuid(),
		...payload,
	};

	const headerBase64 = Buffer.from(JSON.stringify(header)).toString(
		"base64url",
	);
	const payloadBase64 = Buffer.from(JSON.stringify(defaultPayload)).toString(
		"base64url",
	);

	// In real JWT this would be signed, but for testing we can use a consistent string
	const signature = "test-signature";

	return `${headerBase64}.${payloadBase64}.${signature}`;
}

async function createRegularUser(): Promise<TestUser> {
	const adminAuthToken = await getAdminAuthToken();

	const userResult = await mercuriusClient.mutate(Mutation_createUser, {
		headers: {
			authorization: `bearer ${adminAuthToken}`,
		},
		variables: {
			input: {
				emailAddress: `email${faker.string.uuid()}@test.com`,
				password: "password123",
				role: "regular",
				name: "Test User",
				isEmailAddressVerified: false,
			},
		},
	});

	// Assert data exists
	assertToBeNonNullish(userResult.data);
	// Assert createUser exists
	assertToBeNonNullish(userResult.data.createUser);
	// Assert user exists and has id
	assertToBeNonNullish(userResult.data.createUser.user);
	assertToBeNonNullish(userResult.data.createUser.user.id);
	// Assert authenticationToken exists
	assertToBeNonNullish(userResult.data.createUser.authenticationToken);

	const userId = userResult.data.createUser.user.id;
	const authToken = userResult.data.createUser.authenticationToken;

	return {
		authToken,
		userId,
		cleanup: async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { id: userId } },
			});
		},
	};
}

async function createTestAgendaItem(): Promise<TestAgendaItem> {
	const adminAuthToken = await getAdminAuthToken();

	// Create organization
	const createOrgResult = await mercuriusClient.mutate(
		Mutation_createOrganization,
		{
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					name: `Org ${faker.string.uuid()}`,
					countryCode: "us",
				},
			},
		},
	);

	assertToBeNonNullish(createOrgResult.data);
	assertToBeNonNullish(createOrgResult.data.createOrganization);
	const orgId = createOrgResult.data.createOrganization.id;

	// Create event
	const createEventResult = await mercuriusClient.mutate(Mutation_createEvent, {
		headers: {
			authorization: `bearer ${adminAuthToken}`,
		},
		variables: {
			input: {
				name: `Event ${faker.string.uuid()}`,
				organizationId: orgId,
				startAt: new Date().toISOString(),
				endAt: new Date(Date.now() + 86400000).toISOString(),
				description: "Test event",
			},
		},
	});

	assertToBeNonNullish(createEventResult.data);
	assertToBeNonNullish(createEventResult.data.createEvent);
	const eventId = createEventResult.data.createEvent.id;

	// Create agenda folder
	const createFolderResult = await mercuriusClient.mutate(
		Mutation_createAgendaFolder,
		{
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					name: `Folder ${faker.string.uuid()}`,
					eventId: eventId,
					isAgendaItemFolder: true,
				},
			},
		},
	);

	assertToBeNonNullish(createFolderResult.data);
	assertToBeNonNullish(createFolderResult.data.createAgendaFolder);
	const folderId = createFolderResult.data.createAgendaFolder.id;

	// Create agenda item
	const createAgendaItemResult = await mercuriusClient.mutate(
		Mutation_createAgendaItem,
		{
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					name: `Agenda Item ${faker.string.uuid()}`,
					folderId: folderId,
					type: "general",
					duration: "30m",
					description: "Test agenda item description",
				},
			},
		},
	);

	assertToBeNonNullish(createAgendaItemResult.data);
	assertToBeNonNullish(createAgendaItemResult.data.createAgendaItem);
	const agendaItemId = createAgendaItemResult.data.createAgendaItem.id;

	return {
		agendaItemId,
		orgId,
		eventId,
		folderId,
		cleanup: async () => {
			const errors: Error[] = [];
			try {
				await mercuriusClient.mutate(Mutation_deleteAgendaItem, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: agendaItemId } },
				});
			} catch (error) {
				errors.push(error as Error);
				console.error("Failed to delete agenda item:", error);
			}
			try {
				await mercuriusClient.mutate(Mutation_deleteEvent, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: eventId } },
				});
			} catch (error) {
				errors.push(error as Error);
				console.error("Failed to delete event:", error);
			}
			try {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			} catch (error) {
				errors.push(error as Error);
				console.error("Failed to delete organization:", error);
			}
			if (errors.length > 0) {
				throw new AggregateError(errors, "One or more cleanup steps failed");
			}
		},
	};
}

suite("Input Validation Tests", () => {
	test("returns error with 'invalid_arguments' code for invalid input format", async () => {
		const adminAuthToken = await getAdminAuthToken();

		// Create an invalid input by providing a malformed ID
		const agendaItemResult = await mercuriusClient.query(Query_agendaItem, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					id: "invalid-uuid-format", // Invalid UUID format
				},
			},
		});

		expect(agendaItemResult.data.agendaItem).toEqual(null);
		expect(agendaItemResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "id"],
								message: expect.any(String),
							}),
						]),
					}),
					message: expect.any(String),
					path: ["agendaItem"],
				}),
			]),
		);
	});

	suite("Authorization Tests", () => {
		const testCleanupFunctions: Array<() => Promise<void>> = [];

		afterEach(async () => {
			for (const cleanup of testCleanupFunctions.reverse()) {
				try {
					await cleanup();
				} catch (error) {
					console.error("Cleanup failed:", error);
				}
			}
			// Reset the cleanup functions array
			testCleanupFunctions.length = 0;
		});

		test("denies access if user is not organization member and not admin", async () => {
			const { authToken, cleanup: userCleanup } = await createRegularUser();
			testCleanupFunctions.push(userCleanup);

			const { agendaItemId, cleanup: agendaCleanup } =
				await createTestAgendaItem();
			testCleanupFunctions.push(agendaCleanup);

			const agendaItemResult = await mercuriusClient.query(Query_agendaItem, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						id: agendaItemId,
					},
				},
			});

			expect(agendaItemResult.data.agendaItem).toEqual(null);
			expect(agendaItemResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "id"],
								}),
							]),
						}),
						message: expect.any(String),
						path: ["agendaItem"],
					}),
				]),
			);
		});

		test("allows access if user is organization member", async () => {
			const {
				userId,
				authToken,
				cleanup: userCleanup,
			} = await createRegularUser();
			testCleanupFunctions.push(userCleanup);

			const {
				agendaItemId,
				orgId,
				cleanup: agendaCleanup,
			} = await createTestAgendaItem();
			testCleanupFunctions.push(agendaCleanup);

			const membershipResult = await mercuriusClient.mutate(
				Mutation_createOrganizationMembership,
				{
					headers: {
						authorization: `bearer ${await getAdminAuthToken()}`,
					},
					variables: {
						input: {
							memberId: userId,
							organizationId: orgId, // Use orgId captured from createTestAgendaItem
							role: "regular",
						},
					},
				},
			);

			assertToBeNonNullish(membershipResult.data);
			assertToBeNonNullish(membershipResult.data.createOrganizationMembership);

			const agendaItemResult = await mercuriusClient.query(Query_agendaItem, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						id: agendaItemId,
					},
				},
			});

			expect(agendaItemResult.errors).toBeUndefined();
			expect(agendaItemResult.data.agendaItem).toEqual(
				expect.objectContaining({
					id: agendaItemId,
					name: expect.any(String),
				}),
			);
		});

		test("allows access if user is organization admin", async () => {
			// Create test resources
			const {
				userId,
				authToken,
				cleanup: userCleanup,
			} = await createRegularUser();
			testCleanupFunctions.push(userCleanup);

			const {
				agendaItemId,
				orgId,
				cleanup: agendaCleanup,
			} = await createTestAgendaItem();
			testCleanupFunctions.push(agendaCleanup);

			// Add user as organization admin
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: {
					authorization: `bearer ${await getAdminAuthToken()}`,
				},
				variables: {
					input: {
						memberId: userId,
						organizationId: orgId,
					},
				},
			});

			const agendaItemResult = await mercuriusClient.query(Query_agendaItem, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						id: agendaItemId,
					},
				},
			});

			expect(agendaItemResult.errors).toBeUndefined();
			expect(agendaItemResult.data.agendaItem).toEqual(
				expect.objectContaining({
					id: agendaItemId,
					name: expect.any(String),
				}),
			);
		});

		test("allows access if user is organization admin", async () => {
			const {
				userId,
				authToken,
				cleanup: userCleanup,
			} = await createRegularUser();
			testCleanupFunctions.push(userCleanup);

			const {
				agendaItemId,
				orgId,
				cleanup: agendaCleanup,
			} = await createTestAgendaItem();
			testCleanupFunctions.push(agendaCleanup);

			// Add user as organization admin
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: {
					authorization: `bearer ${await getAdminAuthToken()}`,
				},
				variables: {
					input: {
						memberId: userId,
						organizationId: orgId,
						role: "administrator",
					},
				},
			});

			const agendaItemResult = await mercuriusClient.query(Query_agendaItem, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						id: agendaItemId,
					},
				},
			});

			expect(agendaItemResult.errors).toBeUndefined();
			expect(agendaItemResult.data.agendaItem).toEqual(
				expect.objectContaining({
					id: agendaItemId,
					name: expect.any(String),
				}),
			);
		});
	});

	suite("Token Validation Tests", () => {
		test("returns error with malformed JWT token", async () => {
			const header = faker.string.alphanumeric(10);
			const payload = faker.string.alphanumeric(15);
			const malformedToken = `${header}.${payload}`;

			const result = await mercuriusClient.query(Query_agendaItem, {
				headers: {
					authorization: `bearer ${malformedToken}`,
				},
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			});

			expect(result.data.agendaItem).toEqual(null);
			expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
		});

		test("returns error with expired token", async () => {
			// Create token that expired 1 hour ago
			const expiredToken = createTestToken({
				exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
				iat: Math.floor(Date.now() / 1000) - 7200, // Created 2 hours ago
			});

			const result = await mercuriusClient.query(Query_agendaItem, {
				headers: {
					authorization: `bearer ${expiredToken}`,
				},
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			});

			expect(result.data.agendaItem).toEqual(null);
			expect(result.errors).toEqual([
				expect.objectContaining({
					extensions: {
						code: "unauthenticated",
					},
					message: "You must be authenticated to perform this action.",
					path: ["agendaItem"],
					locations: expect.arrayContaining([
						expect.objectContaining({
							line: expect.any(Number),
							column: expect.any(Number),
						}),
					]),
				}),
			]);
		});

		test("returns error with token containing invalid signature", async () => {
			// Valid format but invalid signature
			const invalidSignatureToken = [
				Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
					"base64",
				),
				Buffer.from(JSON.stringify({ sub: faker.string.uuid() })).toString(
					"base64",
				),
				"invalidsignature",
			].join(".");

			const result = await mercuriusClient.query(Query_agendaItem, {
				headers: {
					authorization: `bearer ${invalidSignatureToken}`,
				},
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			});

			expect(result.data.agendaItem).toEqual(null);
			expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
		});

		test("returns error with empty token", async () => {
			const result = await mercuriusClient.query(Query_agendaItem, {
				headers: {
					authorization: "bearer ",
				},
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			});

			expect(result.data.agendaItem).toEqual(null);
			expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
		});

		test("returns error with token containing invalid character encoding", async () => {
			// Create token with invalid UTF-8 sequence
			const invalidEncodingToken = Buffer.from([0xff, 0xfe, 0xfd]).toString(
				"base64",
			);

			const result = await mercuriusClient.query(Query_agendaItem, {
				headers: {
					authorization: `bearer ${invalidEncodingToken}`,
				},
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			});

			expect(result.data.agendaItem).toEqual(null);
			expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
		});
	});
});
