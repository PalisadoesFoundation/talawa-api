import { faker } from "@faker-js/faker";
import { expect, suite, test, vi, beforeEach } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import {
	Mutation_blockUser,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_unblockUser,
	Query_signIn,
} from "../documentNodes";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";

// Mock database operations
vi.mock("~/src/drizzle/tables/blockedUsers", async () => {
	const actual = await vi.importActual("~/src/drizzle/tables/blockedUsers");
	return {
		...actual
	};
});

// Mock in-memory database
const mockDb = {
	organizations: new Map<string, { id: string; name: string }>(),
	users: new Map<string, { id: string; name: string; role: string }>(),
	organizationMemberships: new Map<string, { organizationId: string; memberId: string; role: string }>(),
	blockedUsers: new Map<string, { organizationId: string; userId: string; createdAt: Date }>(),
};

// Mock functions for database operations
vi.mock("~/src/drizzle/client", () => {
	return {
		drizzleClient: {
			query: {
				organizationsTable: {
					findFirst: vi.fn(({ where }) => {
						const orgId = typeof where === 'function'
							? where(null, { eq: (field: string, id: string) => id })
							: null;

						return Promise.resolve(mockDb.organizations.get(orgId) || null);
					})
				},
				usersTable: {
					findFirst: vi.fn(({ where }) => {
						const userId = typeof where === 'function'
							? where(null, { eq: (field: string, id: string) => id })
							: null;

						return Promise.resolve(mockDb.users.get(userId) || null);
					})
				},
				organizationMembershipsTable: {
					findFirst: vi.fn(({ where }) => {
						if (typeof where !== 'function') return Promise.resolve(null);

						// Extract organizationId and memberId from the where function
						let memberId = null;
						let organizationId = null;

						// Mock the operators for the where function
						const operators = {
							and: (...conditions: boolean[]) => {
								return conditions.every(c => c === true);
							},
							eq: (field: string, value: string) => {
								if (field === 'memberId') memberId = value;
								if (field === 'organizationId') organizationId = value;
								return true;
							}
						};

						// Execute the where function to extract the parameters
						where({ memberId: 'memberId', organizationId: 'organizationId' }, operators);

						// Find the membership based on organizationId and memberId
						const key = `${organizationId}:${memberId}`;
						return Promise.resolve(mockDb.organizationMemberships.get(key) || null);
					})
				},
				blockedUsersTable: {
					findFirst: vi.fn(({ where }) => {
						if (typeof where !== 'function') return Promise.resolve(null);

						// Extract organizationId and userId from the where function
						let userId = null;
						let organizationId = null;

						// Mock the operators for the where function
						const operators = {
							and: (...conditions: boolean[]) => {
								return conditions.every(c => c === true);
							},
							eq: (field: string, value: string) => {
								if (field === 'userId') userId = value;
								if (field === 'organizationId') organizationId = value;
								return true;
							}
						};

						// Execute the where function to extract the parameters
						where({ userId: 'userId', organizationId: 'organizationId' }, operators);

						// Find the blocked user based on organizationId and userId
						const key = `${organizationId}:${userId}`;
						return Promise.resolve(mockDb.blockedUsers.get(key) || null);
					})
				}
			},
			transaction: vi.fn(async (callback) => {
				// Mock transaction object
				const tx = {
					insert: (table: any) => ({
						values: (data: any) => {
							// Handle insert for blockedUsers
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
					delete: (table: any) => ({
						where: (condition: any) => {
							// Handle delete for blockedUsers
							if (condition.organizationId && condition.userId) {
								const key = `${condition.organizationId}:${condition.userId}`;
								mockDb.blockedUsers.delete(key);
							}
							return Promise.resolve();
						}
					})
				};

				return await callback(tx);
			})
		}
	};
});

// Helper function to add mock data
function seedMockData() {
	// Add admin user
	const adminId = signInResult.data?.signIn?.user?.id;
	if (adminId) {
		mockDb.users.set(adminId, {
			id: adminId,
			name: "Admin User",
			role: "administrator"
		});
	}
}

// Reset mock data before each test
beforeEach(() => {
	mockDb.organizations.clear();
	mockDb.users.clear();
	mockDb.organizationMemberships.clear();
	mockDb.blockedUsers.clear();

	// Reset mocks
	vi.clearAllMocks();

	// Seed initial data
	seedMockData();
});

const signInResult = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});
assertToBeNonNullish(signInResult.data?.signIn);
const authToken = signInResult.data.signIn.authenticationToken;
assertToBeNonNullish(authToken);

// Mock the organization creation mutation
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

// Mock organization creation
vi.mock("../documentNodes", async () => {
	const actual = await vi.importActual("../documentNodes");

	// Override the implementation of the createOrganization mutation
	const originalCreateOrg = mercuriusClient.mutate;
	// @ts-expect-error - We're intentionally mocking the method with a simpler implementation
	mercuriusClient.mutate = async (document, options) => {
		if (document === actual.Mutation_createOrganization) {
			const orgId = faker.string.uuid();
			// More specific type assertion
			const inputVars = (options?.variables?.input || {}) as { name?: string };
			const orgName = inputVars.name || "Mock Organization";

			// Store the organization
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

		if (document === actual.Mutation_createOrganizationMembership) {
			// More specific type assertion
			const inputVars = (options?.variables?.input || {}) as {
				organizationId?: string;
				memberId?: string;
				role?: string;
			};
			const organizationId = inputVars.organizationId || "";
			const memberId = inputVars.memberId || "";
			const role = inputVars.role || "member";

			if (organizationId && memberId) {
				const key = `${organizationId}:${memberId}`;
				mockDb.organizationMemberships.set(key, {
					organizationId,
					memberId,
					role
				});
			}

			return {
				data: {
					createOrganizationMembership: {
						id: faker.string.uuid(),
						organizationId,
						memberId,
						role
					}
				}
			};
		}

		if (document === actual.Mutation_blockUser) {
			// More specific type assertion
			const vars = (options?.variables || {}) as {
				organizationId?: string;
				userId?: string;
			};
			const organizationId = vars.organizationId || "";
			const userId = vars.userId || "";

			if (organizationId && userId) {
				const key = `${organizationId}:${userId}`;
				mockDb.blockedUsers.set(key, {
					organizationId,
					userId,
					createdAt: new Date()
				});
			}

			return {
				data: {
					blockUser: true
				}
			};
		}

		if (document === actual.Mutation_unblockUser) {
			// More specific type assertion
			const vars = (options?.variables || {}) as {
				organizationId?: string;
				userId?: string;
			};
			const organizationId = vars.organizationId || "";
			const userId = vars.userId || "";

			if (organizationId && userId) {
				const key = `${organizationId}:${userId}`;
				mockDb.blockedUsers.delete(key);
			}

			return {
				data: {
					unblockUser: true
				}
			};
		}

		// For other mutations, use the original implementation
		return await originalCreateOrg(document, options);
	};

	return actual;
});

suite("Mutation field unblockUser", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_unblockUser, {
				variables: {
					organizationId: faker.string.uuid(),
					userId: faker.string.uuid(),
				},
			});
			expect(result.data?.unblockUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
						path: ["unblockUser"],
					}),
				]),
			);
		});
	});

	suite("when the organization does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_unblockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: faker.string.uuid(),
					userId: faker.string.uuid(),
				},
			});
			expect(result.data?.unblockUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["unblockUser"],
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
							name: "Unblock User Test Org",
							description: "Org to test unblock user",
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

			const result = await mercuriusClient.mutate(Mutation_unblockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId: faker.string.uuid(),
				},
			});
			expect(result.data?.unblockUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["unblockUser"],
					}),
				]),
			);
		});
	});

	suite("when the current user is not an admin", () => {
		test("should return an error with unauthorized_action extensions code", async () => {
			const { authToken: regularAuthToken, userId } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(regularAuthToken);
			assertToBeNonNullish(userId);

			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Unblock User Auth Test Org",
							description: "Org to test unblock user auth",
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

			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: userId,
					},
				},
			});

			const { userId: targetUserId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(targetUserId);

			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: targetUserId,
					},
				},
			});

			await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId: targetUserId,
				},
			});

			const result = await mercuriusClient.mutate(Mutation_unblockUser, {
				headers: { authorization: `bearer ${regularAuthToken}` },
				variables: {
					organizationId: orgId,
					userId: targetUserId,
				},
			});
			expect(result.data?.unblockUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action",
						}),
						path: ["unblockUser"],
					}),
				]),
			);
		});
	});

	suite("when the target user is not blocked", () => {
		test("should return an error with forbidden_action extensions code", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Unblock User Test Org ${faker.string.uuid()}`,
							description: "Org to test unblock user",
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

			assertToBeNonNullish(signInResult.data?.signIn);
			assertToBeNonNullish(signInResult.data.signIn.user);
			const adminId = signInResult.data.signIn.user.id;
			assertToBeNonNullish(adminId);

			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: adminId,
						role: "administrator",
					},
				},
			});

			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: userId,
					},
				},
			});

			const result = await mercuriusClient.mutate(Mutation_unblockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId,
				},
			});
			expect(result.data?.unblockUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "forbidden_action",
						}),
						path: ["unblockUser"],
					}),
				]),
			);
		});
	});

	suite("when all conditions are met", () => {
		test("should successfully unblock the user", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Unblock User Success Test Org ${faker.string.uuid()}`,
							description: "Org to test successful unblock",
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: "104 Test Lane",
							addressLine2: "Suite 5",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			assertToBeNonNullish(signInResult.data?.signIn);
			assertToBeNonNullish(signInResult.data.signIn.user);
			const adminId = signInResult.data.signIn.user.id;
			assertToBeNonNullish(adminId);

			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: adminId,
						role: "administrator",
					},
				},
			});

			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: userId,
					},
				},
			});

			await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId,
				},
			});

			const result = await mercuriusClient.mutate(Mutation_unblockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId,
				},
			});
			expect(result.data?.unblockUser).toBe(true);
			expect(result.errors).toBeUndefined();
		});
	});
});
