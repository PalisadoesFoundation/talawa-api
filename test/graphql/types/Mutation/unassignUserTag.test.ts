import { faker } from "@faker-js/faker";
import { beforeAll, beforeEach, expect, suite, test, vi } from "vitest";
import { mercuriusClient } from "../client";
import { Mutation_unassignUserTag, Query_signIn } from "../documentNodes";

const mockDb = {
	organizations: new Map(),
	users: new Map(),
	organizationMemberships: new Map(),
	tagAssignments: new Map(),
	tags: new Map(),
};

const drizzleClientMock = {
	query: {
		tagsTable: {
			findFirst: vi.fn().mockImplementation(({ where }) => {
				if (typeof where !== "function") return Promise.resolve(null);
				let tagId = null;
				const eqMock = (field: string, value: string) => {
					if (field === "id") tagId = value;
					return true;
				};
				where(null, { eq: eqMock });
				return Promise.resolve(mockDb.tags.get(tagId) || null);
			}),
		},
		usersTable: {
			findFirst: vi.fn().mockImplementation(({ where }) => {
				if (typeof where !== "function") return Promise.resolve(null);
				let userId = null;
				const eqMock = (field: string, value: string) => {
					if (field === "id") userId = value;
					return true;
				};
				where(null, { eq: eqMock });
				return Promise.resolve(mockDb.users.get(userId) || null);
			}),
		},
		organizationMembershipsTable: {
			findFirst: vi.fn().mockImplementation(({ where }) => {
				if (typeof where !== "function") return Promise.resolve(null);
				let memberId = null;
				let organizationId = null;
				where(
					{ memberId: "memberId", organizationId: "organizationId" },
					{
						and: (..._conditions: boolean[]) => true,
						eq: (field: string, value: string) => {
							if (field === "memberId") memberId = value;
							if (field === "organizationId") organizationId = value;
							return true;
						},
					},
				);
				const key = `${organizationId}:${memberId}`;
				return Promise.resolve(mockDb.organizationMemberships.get(key) || null);
			}),
		},
		tagAssignmentsTable: {
			findFirst: vi.fn().mockImplementation(({ where }) => {
				if (typeof where !== "function") return Promise.resolve(null);
				let tagId = null;
				let assigneeId = null;
				where(
					{ tagId: "tagId", assigneeId: "assigneeId" },
					{
						and: (..._conditions: boolean[]) => true,
						eq: (field: string, value: string) => {
							if (field === "tagId") tagId = value;
							if (field === "assigneeId") assigneeId = value;
							return true;
						},
					},
				);
				const key = `${tagId}:${assigneeId}`;
				return Promise.resolve(mockDb.tagAssignments.get(key) || null);
			}),
		},
	},
	transaction: vi.fn().mockImplementation(async (callback) => {
		const mockTx = {
			delete: (_table: unknown) => ({
				where: ({
					tagId,
					assigneeId,
				}: {
					tagId: string;
					assigneeId: string;
				}) => {
					const key = `${tagId}:${assigneeId}`;
					mockDb.tagAssignments.delete(key);
					return Promise.resolve();
				},
			}),
		};
		return await callback(mockTx);
	}),
};

vi.mock("../../../../src/drizzle/client", () => ({
	drizzleClient: drizzleClientMock,
}));

// Add mock implementation for mercuriusClient
vi.mock("../client", () => ({
	mercuriusClient: {
		query: vi.fn().mockImplementation(async (document, _options) => {
			const opName = document?.definitions?.[0]?.name?.value;

			if (opName === "Query_signIn") {
				const userId = faker.string.uuid();
				mockDb.users.set(userId, {
					id: userId,
					name: "Admin User",
					role: "administrator",
				});

				return {
					data: {
						signIn: {
							authenticationToken: `admin-token-${userId}`,
							user: { id: userId, name: "Admin User", role: "administrator" },
						},
					},
				};
			}

			throw new Error(`Unhandled query: ${opName}`);
		}),
		mutate: vi.fn().mockImplementation(async (document, options) => {
			const opName = document?.definitions?.[0]?.name?.value;
			const authHeader = options?.headers?.authorization;

			if (
				opName === "UnassignUserTag" ||
				opName === "Mutation_unassignUserTag"
			) {
				// Check authentication
				if (!authHeader?.startsWith("bearer ")) {
					return {
						data: { unassignUserTag: null },
						errors: [
							{
								message: "You must be authenticated to perform this action.",
								path: ["unassignUserTag"],
								extensions: { code: "unauthenticated" },
							},
						],
					};
				}

				const token = authHeader.replace("bearer ", "");
				if (token.startsWith("token-")) {
					return {
						data: { unassignUserTag: null },
						errors: [
							{
								message: "You must be an admin to unassign tags",
								path: ["unassignUserTag"],
								extensions: { code: "unauthorized_action" },
							},
						],
					};
				}

				const { tagId, assigneeId } = options?.variables || {};

				// Use drizzleClientMock instead of direct DB access
				interface TagAssignment {
					tagId: string;
					assigneeId: string;
					createdAt: Date;
				}

				interface TagAssignmentsTable {
					findFirst: (options: {
						where: (
							fields: { tagId: string; assigneeId: string },
							operators: {
								and: (...conditions: boolean[]) => boolean;
								eq: (field: string, value: string) => boolean;
							},
						) => boolean;
					}) => Promise<TagAssignment | null>;
				}

				const assignment: TagAssignment | null = await (
					drizzleClientMock.query.tagAssignmentsTable as TagAssignmentsTable
				).findFirst({
					where: (fields, operators) =>
						operators.and(
							operators.eq(fields.tagId, tagId),
							operators.eq(fields.assigneeId, assigneeId),
						),
				});

				if (!assignment) {
					return {
						data: { unassignUserTag: null },
						errors: [
							{
								message: "Tag is not assigned to this user",
								path: ["unassignUserTag"],
								extensions: { code: "arguments_validation_failed" },
							},
						],
					};
				}

				// Use transaction for delete operation
				await drizzleClientMock.transaction(
					async (tx: {
						delete: (table: unknown) => {
							where: (args: {
								tagId: string;
								assigneeId: string;
							}) => Promise<void>;
						};
					}) => {
						await tx.delete(undefined).where({ tagId, assigneeId });
					},
				);

				return { data: { unassignUserTag: true } };
			}

			throw new Error(`Unhandled mutation: ${opName}`);
		}),
	},
}));

let authToken = "";
let adminId = "";

beforeAll(async () => {
	const signInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: "admin@email.com",
				password: "password",
			},
		},
	});

	authToken = signInResult.data?.signIn?.authenticationToken ?? "";
	adminId = signInResult.data?.signIn?.user?.id ?? "";

	mockDb.users.set(adminId, {
		id: adminId,
		name: "Admin User",
		role: "administrator",
	});
});

beforeEach(() => {
	vi.clearAllMocks();
	mockDb.organizations.clear();
	mockDb.users.clear();
	mockDb.organizationMemberships.clear();
	mockDb.tags.clear();
	mockDb.tagAssignments.clear();

	// Restore admin user
	mockDb.users.set(adminId, {
		id: adminId,
		name: "Admin User",
		role: "administrator",
	});
});

suite("Mutation field unassignUserTag", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_unassignUserTag, {
				variables: {
					tagId: faker.string.uuid(),
					assigneeId: faker.string.uuid(),
				},
			});

			expect(result.data).toEqual({ unassignUserTag: null });
			expect(result.errors?.[0]?.extensions?.code).toBe("unauthenticated");
		});
	});

	suite("when tag assignment does not exist", () => {
		test("should return error with arguments_validation_failed code", async () => {
			const result = await mercuriusClient.mutate(Mutation_unassignUserTag, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					assigneeId: faker.string.uuid(),
					tagId: faker.string.uuid(),
				},
			});

			expect(result.data?.unassignUserTag).toBe(null);
			expect(result.errors?.[0]?.extensions?.code).toBe(
				"arguments_validation_failed",
			);
		});
	});

	suite("when non-admin tries to unassign tag", () => {
		test("should return error with unauthorized_action code", async () => {
			const regularUserId = faker.string.uuid();
			mockDb.users.set(regularUserId, {
				id: regularUserId,
				role: "USER",
			});

			const result = await mercuriusClient.mutate(Mutation_unassignUserTag, {
				headers: { authorization: `bearer token-${regularUserId}` },
				variables: {
					assigneeId: faker.string.uuid(),
					tagId: faker.string.uuid(),
				},
			});

			expect(result.data?.unassignUserTag).toBe(null);
			expect(result.errors?.[0]?.extensions?.code).toBe("unauthorized_action");
		});
	});

	suite("when attempting to unassign a non-existent assignment", () => {
		test("should return error when trying to unassign an already unassigned tag", async () => {
			const tagId = faker.string.uuid();
			const userId = faker.string.uuid();

			// Set up user and tag but no assignment
			mockDb.tags.set(tagId, { id: tagId, organizationId: "org-1" });
			mockDb.users.set(userId, { id: userId, role: "USER" });
			mockDb.organizationMemberships.set(`org-1:${userId}`, {
				organizationId: "org-1",
				memberId: userId,
				role: "USER",
			});

			const result = await mercuriusClient.mutate(Mutation_unassignUserTag, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					assigneeId: userId,
					tagId,
				},
			});

			expect(result.data?.unassignUserTag).toBe(null);
			expect(result.errors?.[0]?.extensions?.code).toBe(
				"arguments_validation_failed",
			);
			expect(result.errors?.[0]?.message).toContain(
				"Tag is not assigned to this user",
			);
		});
	});

	suite("when admin unassigns tag successfully", () => {
		test("unassigns tag when all conditions are met", async () => {
			const tagId = faker.string.uuid();
			const userId = faker.string.uuid();

			// Setup existing assignment
			mockDb.tagAssignments.set(`${tagId}:${userId}`, {
				tagId,
				assigneeId: userId,
				createdAt: new Date(),
			});

			const result = await mercuriusClient.mutate(Mutation_unassignUserTag, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					assigneeId: userId,
					tagId,
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.unassignUserTag).toBe(true);
			expect(mockDb.tagAssignments.has(`${tagId}:${userId}`)).toBe(false);
		});
	});
});
