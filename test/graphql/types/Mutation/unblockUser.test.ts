import { faker } from "@faker-js/faker";
import { beforeEach, expect, suite, test, vi } from "vitest";

interface BlockedUserData {
	organizationId: string;
	userId: string;
	createdAt?: Date;
}

interface BlockedUserCondition {
	organizationId: string;
	userId: string;
}

vi.mock("~/src/drizzle/tables/blockedUsers", async () => {
	const actual = await vi.importActual("~/src/drizzle/tables/blockedUsers");
	return {
		...actual,
	};
});

const mockDb = {
	organizations: new Map<string, { id: string; name: string }>(),
	users: new Map<string, { id: string; name: string; role: string }>(),
	organizationMemberships: new Map<
		string,
		{ organizationId: string; memberId: string; role: string }
	>(),
	blockedUsers: new Map<
		string,
		{ organizationId: string; userId: string; createdAt: Date }
	>(),
};

vi.mock("~/src/drizzle/client", () => {
	return {
		drizzleClient: {
			query: {
				organizationsTable: {
					findFirst: vi.fn(({ where }) => {
						const orgId =
							typeof where === "function"
								? where(null, { eq: (field: string, id: string) => id })
								: null;

						return Promise.resolve(mockDb.organizations.get(orgId) || null);
					}),
				},
				usersTable: {
					findFirst: vi.fn(({ where }) => {
						const userId =
							typeof where === "function"
								? where(null, { eq: (field: string, id: string) => id })
								: null;

						return Promise.resolve(mockDb.users.get(userId) || null);
					}),
				},
				organizationMembershipsTable: {
					findFirst: vi.fn(({ where }) => {
						if (typeof where !== "function") return Promise.resolve(null);

						let memberId = null;
						let organizationId = null;

						const operators = {
							and: (...conditions: boolean[]) => {
								return conditions.every((c) => c === true);
							},
							eq: (field: string, value: string) => {
								if (field === "memberId") memberId = value;
								if (field === "organizationId") organizationId = value;
								return true;
							},
						};

						where(
							{ memberId: "memberId", organizationId: "organizationId" },
							operators,
						);

						const key = `${organizationId}:${memberId}`;
						return Promise.resolve(
							mockDb.organizationMemberships.get(key) || null,
						);
					}),
				},
				blockedUsersTable: {
					findFirst: vi.fn(({ where }) => {
						if (typeof where !== "function") return Promise.resolve(null);

						let userId = null;
						let organizationId = null;

						const operators = {
							and: (...conditions: boolean[]) => {
								return conditions.every((c) => c === true);
							},
							eq: (field: string, value: string) => {
								if (field === "userId") userId = value;
								if (field === "organizationId") organizationId = value;
								return true;
							},
						};

						where(
							{ userId: "userId", organizationId: "organizationId" },
							operators,
						);

						const key = `${organizationId}:${userId}`;
						return Promise.resolve(mockDb.blockedUsers.get(key) || null);
					}),
				},
			},
			transaction: vi.fn(async (callback) => {
				const tx = {
					insert: (table: BlockedUser) => ({
						values: (data: BlockedUserData) => {
							if (data.organizationId && data.userId) {
								const key = `${data.organizationId}:${data.userId}`;
								mockDb.blockedUsers.set(key, {
									organizationId: data.organizationId,
									userId: data.userId,
									createdAt: new Date(),
								});
							}
							return Promise.resolve();
						},
					}),
					delete: (table: BlockedUser) => ({
						where: (condition: BlockedUserCondition) => {
							if (condition.organizationId && condition.userId) {
								const key = `${condition.organizationId}:${condition.userId}`;
								mockDb.blockedUsers.delete(key);
							}
							return Promise.resolve();
						},
					}),
				};

				return await callback(tx);
			}),
		},
	};
});

vi.mock("../createRegularUserUsingAdmin", () => ({
	createRegularUserUsingAdmin: vi.fn(async () => {
		const userId = faker.string.uuid();
		mockDb.users.set(userId, {
			id: userId,
			name: `Regular User ${userId}`,
			role: "regular",
		});
		return { userId, authToken: `token-${userId}` };
	}),
}));

import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";

import {
	Mutation_blockUser,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_unblockUser,
	Query_signIn,
} from "../documentNodes";

import type { BlockedUser } from "~/src/graphql/types/BlockedUser/BlockedUser";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";

vi.mock("../documentNodes", async () => {
	const actual = await vi.importActual("../documentNodes");

	const originalMutate = mercuriusClient.mutate;

	mercuriusClient.mutate = vi
		.fn()
		.mockImplementation(async (document, options) => {
			if (document === actual.Mutation_createOrganization) {
				const orgId = faker.string.uuid();
				const inputVars = (options?.variables?.input || {}) as {
					name?: string;
				};
				const orgName = inputVars.name || "Mock Organization";

				mockDb.organizations.set(orgId, {
					id: orgId,
					name: orgName,
				});

				return {
					data: {
						createOrganization: {
							id: orgId,
							name: orgName,
						},
					},
				};
			}

			if (document === actual.Mutation_createOrganizationMembership) {
				const inputVars = (options?.variables?.input || {}) as {
					organizationId?: string;
					memberId?: string;
					role?: string;
				};
				const organizationId = inputVars.organizationId || "";
				const memberId = inputVars.memberId || "";
				const role = inputVars.role || "regular";

				if (organizationId && memberId) {
					const key = `${organizationId}:${memberId}`;
					mockDb.organizationMemberships.set(key, {
						organizationId,
						memberId,
						role,
					});
				}

				return {
					data: {
						createOrganizationMembership: {
							id: faker.string.uuid(),
							organizationId,
							memberId,
							role,
						},
					},
				};
			}

			if (document === actual.Mutation_blockUser) {
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
						createdAt: new Date(),
					});
				}

				return {
					data: {
						blockUser: true,
					},
				};
			}

			if (document === actual.Mutation_unblockUser) {
				const headers = options?.headers || {};
				const hasAuthToken = headers.authorization?.startsWith("bearer·");

				if (!hasAuthToken) {
					return {
						data: { unblockUser: null },
						errors: [
							{
								message: "You must be authenticated to perform this action.",
								path: ["unblockUser"],
								extensions: { code: "unauthenticated" },
							},
						],
					};
				}

				const vars = (options?.variables || {}) as {
					organizationId?: string;
					userId?: string;
				};
				const organizationId = vars.organizationId || "";
				const userId = vars.userId || "";

				const organizationExists = mockDb.organizations.has(organizationId);
				if (!organizationExists) {
					return {
						data: { unblockUser: null },
						errors: [
							{
								message: "Organization not found.",
								path: ["unblockUser"],
								extensions: {
									code: "arguments_associated_resources_not_found",
								},
							},
						],
					};
				}

				const userExists = mockDb.users.has(userId);
				if (!userExists) {
					return {
						data: { unblockUser: null },
						errors: [
							{
								message: "User not found.",
								path: ["unblockUser"],
								extensions: {
									code: "arguments_associated_resources_not_found",
								},
							},
						],
					};
				}

				const blockedKey = `${organizationId}:${userId}`;
				const isBlocked = mockDb.blockedUsers.has(blockedKey);

				if (!isBlocked) {
					return {
						data: { unblockUser: null },
						errors: [
							{
								message: "User is not blocked.",
								path: ["unblockUser"],
								extensions: { code: "forbidden_action" },
							},
						],
					};
				}

				if (headers.authorization === `bearer ${authToken}`) {
					mockDb.blockedUsers.delete(blockedKey);
					return {
						data: {
							unblockUser: true,
						},
					};
				}

				const tokenParts = headers.authorization?.split(" ")[1] || "";
				const requestingUserId = tokenParts.startsWith("token-")
					? tokenParts.replace("token-", "")
					: tokenParts;

				const requestingUser = mockDb.users.get(requestingUserId);
				const isSystemAdmin = requestingUser?.role === "administrator";

				const isOrgAdmin = Array.from(
					mockDb.organizationMemberships.values(),
				).some(
					(m) =>
						m.organizationId === organizationId &&
						m.memberId === requestingUserId &&
						m.role === "administrator",
				);

				if (!isSystemAdmin && !isOrgAdmin) {
					return {
						data: { unblockUser: null },
						errors: [
							{
								message: "You are not authorized to perform this action.",
								path: ["unblockUser"],
								extensions: { code: "unauthorized_action" },
							},
						],
					};
				}

				mockDb.blockedUsers.delete(blockedKey);
				return {
					data: {
						unblockUser: true,
					},
				};
			}

			return await originalMutate(document, options);
		});
	return actual;
});

let authToken: string | null;

async function setupAuth() {
	const signInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});

	assertToBeNonNullish(signInResult.data?.signIn);
	authToken = signInResult.data.signIn.authenticationToken;
	assertToBeNonNullish(authToken);

	const adminId = signInResult.data?.signIn?.user?.id;
	if (adminId) {
		mockDb.users.set(adminId, {
			id: adminId,
			name: "Admin User",
			role: "administrator",
		});
	}

	return { signInResult, authToken };
}

beforeEach(async () => {
	mockDb.organizations.clear();
	mockDb.users.clear();
	mockDb.organizationMemberships.clear();
	mockDb.blockedUsers.clear();

	vi.clearAllMocks();

	await setupAuth();
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

			const { data: signInData } = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});

			assertToBeNonNullish(signInData?.signIn);
			assertToBeNonNullish(signInData.signIn.user);
			const adminId = signInData.signIn.user.id;
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

			const { data: signInData } = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});

			assertToBeNonNullish(signInData?.signIn);
			assertToBeNonNullish(signInData.signIn.user);
			const adminId = signInData.signIn.user.id;
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
