import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { afterEach, expect, suite, test, vi } from "vitest";
import {
	organizationMembershipsTable,
	organizationsTable,
	usersTable,
} from "~/src/drizzle/schema";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_deleteOrganization,
	Mutation_joinPublicOrganization,
	Query_signIn,
} from "../documentNodes";

/**
 * Helper function to get admin auth token with proper error handling
 * @throws {Error} If admin credentials are invalid or missing
 * @returns {Promise<string>} Admin authentication token
 */
let cachedAdminToken: string | null = null;
let cachedAdminId: string | null = null;
async function getAdminAuthTokenAndId(): Promise<{
	cachedAdminToken: string;
	cachedAdminId: string;
}> {
	if (cachedAdminToken && cachedAdminId) {
		return { cachedAdminToken, cachedAdminId };
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
		if (!adminSignInResult.data?.signIn?.user?.id) {
			throw new Error(
				"Admin authentication succeeded but no user id was returned",
			);
		}
		const token = adminSignInResult.data.signIn.authenticationToken;
		const id = adminSignInResult.data.signIn.user.id;
		cachedAdminToken = token;
		cachedAdminId = id;
		return { cachedAdminToken: token, cachedAdminId: id };
	} catch (error) {
		// Wrap and rethrow with more context
		throw new Error(
			`Failed to get admin authentication token: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

// Helper Types
interface TestOrganization {
	orgId: string;
	cleanup: () => Promise<void>;
}

async function createTestOrganization(
	_userRegistrationRequired = false,
): Promise<TestOrganization> {
	const { cachedAdminToken: adminAuthToken } = await getAdminAuthTokenAndId();

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

	// Check for errors before asserting
	if (!createOrgResult.data || !createOrgResult.data.createOrganization) {
		throw new Error(
			`Failed to create test organization: ${
				createOrgResult.errors?.[0]?.message || "Unknown error"
			}`,
		);
	}

	assertToBeNonNullish(createOrgResult.data);
	assertToBeNonNullish(createOrgResult.data.createOrganization);
	const orgId = createOrgResult.data.createOrganization.id;

	return {
		orgId,
		cleanup: async () => {
			const errors: Error[] = [];
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

suite("Mutation joinPublicOrganization", () => {
	suite("Authentication", () => {
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

		test("Returns an error when the user is unauthenticated", async () => {
			// Create a test organization
			const organization = await createTestOrganization();
			testCleanupFunctions.push(organization.cleanup);

			const joinPublicOrganizationResult = await mercuriusClient.mutate(
				Mutation_joinPublicOrganization,
				{
					variables: {
						input: {
							organizationId: organization.orgId,
						},
					},
				},
			);

			expect(joinPublicOrganizationResult.errors).toBeDefined();
			expect(joinPublicOrganizationResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["joinPublicOrganization"],
					}),
				]),
			);
		});

		test("Returns an error when the user is present in the token but not found in the database", async () => {
			// Create a regular user
			const regularUser = await createRegularUserUsingAdmin();
			// Get the user's auth token
			const { authToken } = regularUser;

			// Create a test organization
			const organization = await createTestOrganization();
			testCleanupFunctions.push(organization.cleanup);

			// Delete the user
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, regularUser.userId))
				.execute();

			// Try to join the organization
			const joinPublicOrganizationResult = await mercuriusClient.mutate(
				Mutation_joinPublicOrganization,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							organizationId: organization.orgId,
						},
					},
				},
			);

			expect(joinPublicOrganizationResult.errors).toBeDefined();
			expect(joinPublicOrganizationResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "not_found",
						}),
						message: expect.any(String),
						path: ["joinPublicOrganization"],
					}),
				]),
			);
		});
	});

	suite("Input Validation", () => {
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

		test("Returns an error when organizationId is not a valid UUID", async () => {
			// Create a regular user
			const regularUser = await createRegularUserUsingAdmin();
			// Get the user's auth token
			const { authToken } = regularUser;

			// Try to join with invalid organizationId
			const joinPublicOrganizationResult = await mercuriusClient.mutate(
				Mutation_joinPublicOrganization,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							organizationId: "invalid-uuid",
						},
					},
				},
			);

			expect(joinPublicOrganizationResult.errors).toBeDefined();
			expect(joinPublicOrganizationResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.arrayContaining([
										"input",
										"organizationId",
									]),
								}),
							]),
						}),
						message: expect.any(String),
					}),
				]),
			);
		});

		test("Returns an error when organizationId is not provided", async () => {
			// Create a regular user
			const regularUser = await createRegularUserUsingAdmin();
			// Get the user's auth token
			const { authToken } = regularUser;

			// Try to join without organizationId
			const joinPublicOrganizationResult = await mercuriusClient.mutate(
				Mutation_joinPublicOrganization,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							organizationId: "",
						},
					},
				},
			);

			expect(joinPublicOrganizationResult.errors).toBeDefined();
			expect(joinPublicOrganizationResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.arrayContaining([
										"input",
										"organizationId",
									]),
								}),
							]),
						}),
						message: expect.any(String),
					}),
				]),
			);
		});
	});

	suite("Business Logic", () => {
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
			// Restore all mocks
			vi.restoreAllMocks();
		});

		test("Returns an error when the organization does not exist", async () => {
			// Create a regular user
			const regularUser = await createRegularUserUsingAdmin();
			// Get the user's auth token
			const { authToken } = regularUser;

			// Try to join a non-existent organization
			const joinPublicOrganizationResult = await mercuriusClient.mutate(
				Mutation_joinPublicOrganization,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							organizationId: faker.string.uuid(),
						},
					},
				},
			);

			expect(joinPublicOrganizationResult.errors).toBeDefined();
			expect(joinPublicOrganizationResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.arrayContaining([
										"input",
										"organizationId",
									]),
								}),
							]),
						}),
						message: expect.any(String),
					}),
				]),
			);
		});

		test("Returns an error when the organization requires user registration", async () => {
			// Create a regular user
			const regularUser = await createRegularUserUsingAdmin();
			const { authToken } = regularUser;

			// Create an organization (without registration requirement)
			const organization = await createTestOrganization();
			testCleanupFunctions.push(organization.cleanup);

			// Update the organization record to require user registration
			await server.drizzleClient
				.update(organizationsTable)
				.set({ userRegistrationRequired: true })
				.where(eq(organizationsTable.id, organization.orgId))
				.execute();

			// Try to join the organization
			const joinPublicOrganizationResult = await mercuriusClient.mutate(
				Mutation_joinPublicOrganization,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							organizationId: organization.orgId,
						},
					},
				},
			);

			expect(joinPublicOrganizationResult.errors).toBeDefined();
			expect(joinPublicOrganizationResult.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "forbidden_action",
							message:
								"This organization requires user registration before joining.",
						}),
						message: expect.any(String),
					}),
				]),
			);
		});

		test("Returns an error when the user is already a member of the organization", async () => {
			// Create a regular user
			const regularUser = await createRegularUserUsingAdmin();
			// Get the user's auth token
			const { authToken } = regularUser;

			// Create an organization
			const organization = await createTestOrganization();
			testCleanupFunctions.push(organization.cleanup);

			// Add the user as a member
			await server.drizzleClient
				.insert(organizationMembershipsTable)
				.values({
					memberId: regularUser.userId,
					organizationId: organization.orgId,
					role: "regular",
					creatorId: regularUser.userId,
				})
				.execute();

			// Try to join the organization again
			const joinPublicOrganizationResult = await mercuriusClient.mutate(
				Mutation_joinPublicOrganization,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							organizationId: organization.orgId,
						},
					},
				},
			);

			expect(joinPublicOrganizationResult.errors).toBeDefined();
			expect(joinPublicOrganizationResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.arrayContaining([
										"input",
										"organizationId",
									]),
									message: "User is already a member of this organization",
								}),
							]),
						}),
						message: expect.any(String),
					}),
				]),
			);
		});

		test("Successfully joins the organization when all conditions are met", async () => {
			// Create a regular user
			const regularUser = await createRegularUserUsingAdmin();
			// Get the user's auth token
			const { authToken } = regularUser;

			// Create an organization
			const organization = await createTestOrganization();
			testCleanupFunctions.push(organization.cleanup);

			// Join the organization
			const joinPublicOrganizationResult = await mercuriusClient.mutate(
				Mutation_joinPublicOrganization,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							organizationId: organization.orgId,
						},
					},
				},
			);

			expect(joinPublicOrganizationResult.errors).toBeUndefined();
			expect(joinPublicOrganizationResult.data).toBeDefined();

			// Check if the data exists before asserting
			if (
				!joinPublicOrganizationResult.data ||
				!joinPublicOrganizationResult.data.joinPublicOrganization
			) {
				throw new Error("Join public organization mutation returned no data");
			}

			assertToBeNonNullish(
				joinPublicOrganizationResult.data.joinPublicOrganization,
			);

			// Verify the membership was created with correct properties
			expect(
				joinPublicOrganizationResult.data.joinPublicOrganization.memberId,
			).toEqual(regularUser.userId);
			expect(
				joinPublicOrganizationResult.data.joinPublicOrganization.organizationId,
			).toEqual(organization.orgId);
			expect(
				joinPublicOrganizationResult.data.joinPublicOrganization.role,
			).toEqual("regular");
			expect(
				joinPublicOrganizationResult.data.joinPublicOrganization.creatorId,
			).toEqual(regularUser.userId);

			// Verify in the database
			const membership =
				await server.drizzleClient.query.organizationMembershipsTable.findFirst(
					{
						where: (fields, operators) =>
							operators.and(
								operators.eq(fields.memberId, regularUser.userId),
								operators.eq(fields.organizationId, organization.orgId),
							),
					},
				);

			expect(membership).toBeDefined();
			expect(membership?.role).toEqual("regular");
		});

		test("Returns an 'unexpected' error when the database insert returns no data", async () => {
			// Create a regular user
			const regularUser = await createRegularUserUsingAdmin();
			// Get the user's auth token
			const { authToken } = regularUser;

			// Create an organization
			const organization = await createTestOrganization();
			testCleanupFunctions.push(organization.cleanup);

			vi.spyOn(server.drizzleClient, "transaction").mockResolvedValue([]);

			const joinPublicOrganizationResult = await mercuriusClient.mutate(
				Mutation_joinPublicOrganization,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							organizationId: organization.orgId,
						},
					},
				},
			);
			expect(joinPublicOrganizationResult.errors).toBeDefined();
			expect(joinPublicOrganizationResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "unexpected",
						}),
						message: expect.any(String),
					}),
				]),
			);
		});
	});
});
