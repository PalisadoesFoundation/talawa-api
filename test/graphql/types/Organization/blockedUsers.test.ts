import { expect, suite, test, vi, beforeEach } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import {
	Mutation_blockUser,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_unblockUser,
	Query_organization,
	Query_signIn,
} from "../../types/documentNodes";
import { server } from "../../../server";
import { mercuriusClient } from "../../types/client";
import { createRegularUserUsingAdmin } from "../../types/createRegularUserUsingAdmin";

// Mock database operations
vi.mock("~/src/drizzle/tables/blockedUsers", async () => {
	const actual = await vi.importActual("~/src/drizzle/tables/blockedUsers");
	return {
		...actual
	};
});

// Mock in-memory blocked users database
const mockBlockedUsers = new Map<string, string[]>();

// Mock implementation for the drizzle client
vi.mock("~/src/drizzle/client", () => {
	return {
		drizzleClient: {
			query: {
				blockedUsersTable: {
					findMany: vi.fn(({ where }) => {
						const organizationId = where?.(null, { eq: () => true });
						return Promise.resolve(
							(mockBlockedUsers.get(organizationId) || []).map(userId => ({
								organizationId,
								userId,
								createdAt: new Date()
							}))
						);
					}),
					findFirst: vi.fn(({ where }) => {
						const organizationId = where?.(null, { eq: () => true });
						const userId = where?.(null, { eq: () => true });
						const blocked = (mockBlockedUsers.get(organizationId) || []).includes(userId);
						return Promise.resolve(blocked ? { organizationId, userId, createdAt: new Date() } : null);
					})
				},
				usersTable: {
					findFirst: vi.fn(({ where }) => {
						const userId = where?.(null, { eq: () => true });
						return Promise.resolve({ id: userId, name: `User ${userId}`, role: 'user' });
					})
				},
				organizationsTable: {
					findFirst: vi.fn(({ where }) => {
						const orgId = where?.(null, { eq: () => true });
						return Promise.resolve({ id: orgId, name: `Organization ${orgId}` });
					})
				},
				organizationMembershipsTable: {
					findFirst: vi.fn(({ where }) => {
						return Promise.resolve({ role: 'administrator' });
					})
				}
			},
			transaction: vi.fn(async (callback) => {
				const tx = {
					insert: (table) => ({
						values: (data) => {
							if (data.organizationId && data.userId) {
								const orgId = data.organizationId;
								const userId = data.userId;
								if (!mockBlockedUsers.has(orgId)) {
									mockBlockedUsers.set(orgId, []);
								}
								mockBlockedUsers.get(orgId)?.push(userId);
								return Promise.resolve();
							}
							return Promise.resolve();
						}
					}),
					delete: (table) => ({
						where: (condition) => {
							if (condition.organizationId && condition.userId) {
								const orgId = condition.organizationId;
								const userId = condition.userId;
								const users = mockBlockedUsers.get(orgId) || [];
								mockBlockedUsers.set(orgId, users.filter(id => id !== userId));
								return Promise.resolve();
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

// Reset mock data before each test
beforeEach(() => {
	mockBlockedUsers.clear();
	vi.clearAllMocks();
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

suite("Organization field blockedUsers", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.query(Query_organization, {
				variables: {
					input: {
						id: "test-organization-id",
					},
					first: 10,
				},
			});
			expect(result.data?.organization).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
					}),
				]),
			);
		});
	});

	suite("when the organization does not have any blocked users", () => {
		test("should return an empty connection", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							name: "Blocked Users Test Org - Empty",
							description: "Org to test blockedUsers field with no blocks",
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

			const result = await mercuriusClient.query(Query_organization, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						id: orgId,
					},
					first: 10,
				},
			});
			assertToBeNonNullish(result.data?.organization);
			expect(result.data.organization.blockedUsers.edges).toEqual([]);
			expect(result.data.organization.blockedUsers.pageInfo).toEqual({
				hasNextPage: false,
				hasPreviousPage: false,
				startCursor: null,
				endCursor: null,
			});
			expect(result.errors).toBeUndefined();
		});
	});

	suite("when the organization has one blocked user", () => {
		test("should return a connection with the blocked user", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							name: "Blocked Users Test Org - Single",
							description: "Org to test blockedUsers field with one block",
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

			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId,
				},
			});

			const result = await mercuriusClient.query(Query_organization, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						id: orgId,
					},
					first: 10,
				},
			});
			assertToBeNonNullish(result.data?.organization);
			expect(result.data.organization.blockedUsers.edges).toHaveLength(1);
			expect(result.data.organization.blockedUsers.edges[0].node.id).toBe(userId);
			expect(result.errors).toBeUndefined();
		});
	});

	suite("when the organization has multiple blocked users", () => {
		test("should return a connection with all blocked users", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							name: "Blocked Users Test Org - Multiple",
							description: "Org to test blockedUsers field with multiple blocks",
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: "102 Test Blvd",
							addressLine2: "Suite 3",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const { userId: userId1 } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId1);

			const { userId: userId2 } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId2);

			const { userId: userId3 } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId3);

			const { userId: userId4 } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId4);

			await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId: userId1,
				},
			});

			await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId: userId2,
				},
			});

			await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId: userId3,
				},
			});

			await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId: userId4,
				},
			});

			const result = await mercuriusClient.query(Query_organization, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						id: orgId,
					},
					first: 10,
				},
			});
			assertToBeNonNullish(result.data?.organization);
			expect(result.data.organization.blockedUsers.edges).toHaveLength(4);
			const blockedUserIds = result.data.organization.blockedUsers.edges.map(
				(edge: { node: { id: string } }) => edge.node.id,
			);
			expect(blockedUserIds).toContain(userId1);
			expect(blockedUserIds).toContain(userId2);
			expect(blockedUserIds).toContain(userId3);
			expect(blockedUserIds).toContain(userId4);
			expect(result.errors).toBeUndefined();
		});
	});

	suite("when unblockUser is called on a blocked user", () => {
		test("should remove the user from the blockedUsers connection", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							name: "Blocked Users Test Org - Unblock",
							description: "Org to test blockedUsers field with unblock",
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: "103 Test Circle",
							addressLine2: "Suite 4",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const { userId: userId1 } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId1);

			const { userId: userId2 } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId2);

			await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId: userId1,
				},
			});

			await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId: userId2,
				},
			});

			let result = await mercuriusClient.query(Query_organization, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						id: orgId,
					},
					first: 10,
				},
			});
			assertToBeNonNullish(result.data?.organization);
			expect(result.data.organization.blockedUsers.edges).toHaveLength(2);

			await mercuriusClient.mutate(Mutation_unblockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId: userId1,
				},
			});

			result = await mercuriusClient.query(Query_organization, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						id: orgId,
					},
					first: 10,
				},
			});
			assertToBeNonNullish(result.data?.organization);
			expect(result.data.organization.blockedUsers.edges).toHaveLength(1);
			expect(result.data.organization.blockedUsers.edges[0].node.id).toBe(userId2);
			expect(result.errors).toBeUndefined();
		});
	});
});
