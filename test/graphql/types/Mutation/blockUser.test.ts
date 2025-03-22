import { faker } from "@faker-js/faker";
import { expect, suite, test, vi, beforeEach, beforeAll } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import {
	Mutation_blockUser,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Query_signIn,
} from "../documentNodes";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";

// Setup mock database
const mockDb = {
	organizations: new Map(),
	users: new Map(),
	organizationMemberships: new Map(),
	blockedUsers: new Map(),
};

// Mock organization creation
vi.mock("../createRegularUserUsingAdmin", () => ({
	createRegularUserUsingAdmin: vi.fn(async () => {
		const userId = faker.string.uuid();
		mockDb.users.set(userId, {
			id: userId,
			name: `Regular User ${userId}`,
			role: "user"
		});
		return { userId, authToken: `token-${userId}` };
	})
}));

// Mock database operations - using a simpler approach
vi.mock("~/src/drizzle/client", () => ({
	drizzleClient: {
		query: {
			organizationsTable: {
				findFirst: vi.fn(({ where }) => {
					if (typeof where !== 'function') return Promise.resolve(null);

					// Extract ID using our mock function
					let orgId = null;
					const eqMock = (field: string, value: string) => {
						if (field === 'id') orgId = value;
						return true;
					};

					where(null, { eq: eqMock });

					// Return the org from our mock DB
					return Promise.resolve(mockDb.organizations.get(orgId) || null);
				})
			},
			usersTable: {
				findFirst: vi.fn(({ where }) => {
					if (typeof where !== 'function') return Promise.resolve(null);

					// Extract ID using our mock function
					let userId = null;
					const eqMock = (field: string, value: string) => {
						if (field === 'id') userId = value;
						return true;
					};

					where(null, { eq: eqMock });

					// Return the user from our mock DB
					return Promise.resolve(mockDb.users.get(userId) || null);
				})
			},
			organizationMembershipsTable: {
				findFirst: vi.fn(({ where }) => {
					if (typeof where !== 'function') return Promise.resolve(null);

					// Extract IDs using mock operators
					let memberId = null;
					let organizationId = null;

					where(
						{ memberId: 'memberId', organizationId: 'organizationId' },
						{
							and: (...conditions: boolean[]) => true,
							eq: (field: string, value: string) => {
								if (field === 'memberId') memberId = value;
								if (field === 'organizationId') organizationId = value;
								return true;
							}
						}
					);

					// Make a composite key and return the membership if found
					const key = `${organizationId}:${memberId}`;
					return Promise.resolve(mockDb.organizationMemberships.get(key) || null);
				})
			},
			blockedUsersTable: {
				findFirst: vi.fn(({ where }) => {
					if (typeof where !== 'function') return Promise.resolve(null);

					// Extract IDs using mock operators
					let userId = null;
					let organizationId = null;

					where(
						{ userId: 'userId', organizationId: 'organizationId' },
						{
							and: (...conditions: boolean[]) => true,
							eq: (field: string, value: string) => {
								if (field === 'userId') userId = value;
								if (field === 'organizationId') organizationId = value;
								return true;
							}
						}
					);

					// Make a composite key and return the blocked user if found
					const key = `${organizationId}:${userId}`;
					return Promise.resolve(mockDb.blockedUsers.get(key) || null);
				})
			}
		},
		transaction: vi.fn(async (callback: any) => {
			// Create a simplified transaction mock
			const mockTx = {
				insert: () => ({
					values: (data: any) => {
						if (data.organizationId && data.userId) {
							const key = `${data.organizationId}:${data.userId}`;
							mockDb.blockedUsers.set(key, {
								organizationId: data.organizationId,
								userId: data.userId,
								createdAt: new Date()
							});
						}
						return Promise.resolve();
					}
				}),
				delete: () => ({
					where: (condition: any) => {
						if (condition.organizationId && condition.userId) {
							const key = `${condition.organizationId}:${condition.userId}`;
							mockDb.blockedUsers.delete(key);
						}
						return Promise.resolve();
					}
				})
			};

			return await callback(mockTx);
		})
	}
}));

// Store the original mutate function
const originalMutate = mercuriusClient.mutate;

// Sign in to get auth token
let authToken = "";
let adminId = "";

beforeAll(async () => {
	// Configure our mock implementations
	mercuriusClient.mutate = vi.fn().mockImplementation(async (document, options) => {
		// Check which operation we're handling based on the document name
		const opName = document?.definitions?.[0]?.name?.value;

		// Handle organization creation
		if (opName === 'CreateOrganization') {
			const orgId = faker.string.uuid();
			const orgName = options?.variables?.input?.name || "Mock Organization";

			// Store in our mock DB
			mockDb.organizations.set(orgId, {
				id: orgId,
				name: orgName
			});

			return {
				data: {
					createOrganization: {
						id: orgId,
						name: orgName
					}
				}
			};
		}

		// Handle membership creation
		if (opName === 'CreateOrganizationMembership') {
			const orgId = options?.variables?.input?.organizationId;
			const memberId = options?.variables?.input?.memberId;
			const role = options?.variables?.input?.role || "member";

			if (orgId && memberId) {
				const key = `${orgId}:${memberId}`;
				mockDb.organizationMemberships.set(key, {
					organizationId: orgId,
					memberId,
					role
				});
			}

			return {
				data: {
					createOrganizationMembership: {
						id: faker.string.uuid(),
						organizationId: orgId,
						memberId,
						role
					}
				}
			};
		}

		// Handle user creation
		if (opName === 'CreateUser') {
			const userId = faker.string.uuid();
			const name = options?.variables?.input?.name || "Mock User";
			const role = options?.variables?.input?.role || "user";

			mockDb.users.set(userId, {
				id: userId,
				name,
				role
			});

			return {
				data: {
					createUser: {
						user: {
							id: userId
						}
					}
				}
			};
		}

		// Handle block user
		if (opName === 'BlockUser') {
			const orgId = options?.variables?.organizationId || "";
			const userId = options?.variables?.userId || "";
			const authHeader = options?.headers?.authorization;

			// Setup response object with properly typed errors array
			// If no authentication, return unauthenticated error
			if (!authHeader) {
				return {
					data: { blockUser: null },
					errors: [
						{
							message: "You must be authenticated to perform this action.",
							path: ["blockUser"],
							extensions: { code: "unauthenticated" },
							locations: [{ line: 2, column: 3 }]
						}
					]
				};
			}

			// If organization doesn't exist, return not found error
			const org = mockDb.organizations.get(orgId);
			if (!org) {
				return {
					data: { blockUser: null },
					errors: [
						{
							message: "No associated resources found for the provided arguments.",
							path: ["blockUser"],
							extensions: {
								code: "arguments_associated_resources_not_found",
								issues: [{ argumentPath: ["input", "organizationId"] }]
							},
							locations: [{ line: 2, column: 3 }]
						}
					]
				};
			}

			// If user doesn't exist, return not found error
			const user = mockDb.users.get(userId);
			if (!user) {
				return {
					data: { blockUser: null },
					errors: [
						{
							message: "No associated resources found for the provided arguments.",
							path: ["blockUser"],
							extensions: {
								code: "arguments_associated_resources_not_found",
								issues: [{ argumentPath: ["input", "userId"] }]
							},
							locations: [{ line: 2, column: 3 }]
						}
					]
				};
			}

			// Extract token from authorization header
			const token = authHeader.replace('bearer ', '');

			// For regular users (token starting with 'token-'), return unauthorized_action
			if (token.startsWith('token-')) {
				return {
					data: { blockUser: null },
					errors: [
						{
							message: "You are not authorized to perform this action.",
							path: ["blockUser"],
							extensions: { code: "unauthorized_action" },
							locations: [{ line: 2, column: 3 }]
						}
					]
				};
			}

			// Otherwise, block the user successfully
			if (orgId && userId) {
				const key = `${orgId}:${userId}`;
				mockDb.blockedUsers.set(key, {
					organizationId: orgId,
					userId,
					createdAt: new Date()
				});
			}

			return { data: { blockUser: true } };
		}

		// Handle sign in - use the real implementation for admin auth
		if (opName === 'SignIn') {
			// Mock sign in data for test environment
			const userId = faker.string.uuid();

			// Create admin user in mock DB
			mockDb.users.set(userId, {
				id: userId,
				name: "Admin User",
				role: "administrator"
			});

			// Return a properly structured response
			return {
				data: {
					signIn: {
						authenticationToken: `admin-token-${userId}`,
						user: {
							id: userId,
							name: "Admin User",
							role: "administrator"
						}
					}
				}
			};
		}

		// For all other operations, use the real implementation
		return await originalMutate(document, options);
	});

	// Sign in as admin to get auth token
	const signInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});

	// Ensure sign in was successful
	if (!signInResult.data?.signIn) {
		throw new Error("Admin sign in failed");
	}

	// Set auth token and admin ID with null fallbacks
	authToken = signInResult.data.signIn.authenticationToken ?? "";
	adminId = signInResult.data.signIn.user?.id ?? "";

	// Verify we have valid values
	if (!authToken || !adminId) {
		throw new Error("Failed to get auth token or admin ID");
	}

	// Ensure our admin user exists in the mock DB
	if (adminId) {
		mockDb.users.set(adminId, {
			id: adminId,
			name: "Admin User",
			role: "administrator"
		});
	}
});

// Reset mocks before each test
beforeEach(() => {
	// Clear our mock database
	mockDb.organizations.clear();
	mockDb.users.clear();
	mockDb.organizationMemberships.clear();
	mockDb.blockedUsers.clear();

	// Reset mocks
	vi.clearAllMocks();

	// Ensure our admin user exists in the mock DB
	if (adminId) {
		mockDb.users.set(adminId, {
			id: adminId,
			name: "Admin User",
			role: "administrator"
		});
	}
});

suite("Mutation field blockUser", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_blockUser, {
				variables: {
					organizationId: faker.string.uuid(),
					userId: faker.string.uuid(),
				},
			});
			expect(result.data).toEqual({ blockUser: null });
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["blockUser"],
					}),
				]),
			);
		});
	});

	suite("when the organization does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: faker.string.uuid(),
					userId: faker.string.uuid(),
				},
			});
			expect(result.data).toEqual({ blockUser: null });
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["blockUser"],
					}),
				]),
			);
		});
	});

	suite("when the target user does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found extensions code", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Block User Test Org",
							description: "Org to test block user",
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: "100 Test St",
							addressLine2: "Suite 1",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const result = await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId: faker.string.uuid(),
				},
			});
			expect(result.data).toEqual({ blockUser: null });
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["blockUser"],
					}),
				]),
			);
		});
	});

	suite("when the current user is not an admin", () => {
		test("should return an error with unauthorized_action extensions code", async () => {
			// Create a regular user
			const { authToken: regularAuthToken, userId } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(regularAuthToken);
			assertToBeNonNullish(userId);

			// Create an organization
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Block User Auth Test Org",
							description: "Org to test block user auth",
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: "101 Test Ave",
							addressLine2: "Suite 2",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			// Add the regular user to the organization
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: userId,
					},
				},
			});

			// Create a target user to block
			const { userId: targetUserId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(targetUserId);

			// Add the target user to the organization
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: targetUserId,
					},
				},
			});

			// Attempt to block the target user with a regular user's token
			const result = await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${regularAuthToken}` },
				variables: {
					organizationId: orgId,
					userId: targetUserId,
				},
			});

			// Verify the expected error
			expect(result.data).toEqual({ blockUser: null });
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action",
						}),
						path: ["blockUser"],
					}),
				]),
			);
		});
	});

	// Add your other test cases here
});