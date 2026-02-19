import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { mercuriusClient } from "test/graphql/types/client";
import { createRegularUserUsingAdmin } from "test/graphql/types/createRegularUserUsingAdmin";
import { Mutation_createOrganization } from "test/graphql/types/documentNodes";
import { assertToBeNonNullish } from "test/helpers";
import { getAdminAuthViaRest } from "test/helpers/adminAuthRest";
import { describe, expect, it } from "vitest";
import {
	blockedUsersTable,
	blockedUsersTableRelations,
	organizationsTable,
	usersTable,
} from "~/src/drizzle/schema";
import { blockedUsersTableInsertSchema } from "~/src/drizzle/tables/blockedUsers";
import { server } from "../../server";

async function createTestOrganization(): Promise<string> {
	mercuriusClient.setHeaders({});
	const { accessToken: token } = await getAdminAuthViaRest(server);
	assertToBeNonNullish(
		token,
		"Authentication token is missing from sign-in response",
	);
	const org = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${token}` },
		variables: {
			input: {
				name: `Org-${Date.now()}`,
				countryCode: "us",
				isUserRegistrationRequired: true,
			},
		},
	});
	if (org.errors) {
		throw new Error(
			`Create organization failed: ${JSON.stringify(org.errors)}`,
		);
	}
	const orgId = org.data?.createOrganization?.id;
	assertToBeNonNullish(
		orgId,
		"Organization ID is missing from creation response",
	);
	return orgId;
}

describe("src/drizzle/tables/blockedUsers.ts", () => {
	describe("blockedUser Table Schema", () => {
		it("should have the correct schema", () => {
			const columns = Object.keys(blockedUsersTable);
			expect(columns).toContain("createdAt");
			expect(columns).toContain("id");
			expect(columns).toContain("organizationId");
			expect(columns).toContain("userId");
		});

		it("should have correct primary key configuration", () => {
			expect(blockedUsersTable.id.primary).toBe(true);
		});

		it("should have required fields configured as not null", () => {
			expect(blockedUsersTable.createdAt.notNull).toBe(true);
			expect(blockedUsersTable.organizationId.notNull).toBe(true);
			expect(blockedUsersTable.userId.notNull).toBe(true);
		});

		it("should have default values configured", () => {
			expect(blockedUsersTable.createdAt.hasDefault).toBe(true);
			expect(blockedUsersTable.id.hasDefault).toBe(true);
		});
	});

	describe("Foreign Key Relationships", () => {
		it("should reject insert with invalid userId foreign key", async () => {
			const invalidUserId = faker.string.uuid();
			const orgId = await createTestOrganization();

			await expect(
				server.drizzleClient.insert(blockedUsersTable).values({
					organizationId: orgId,
					userId: invalidUserId,
				}),
			).rejects.toThrow();
		});

		it("should reject insert with empty userId foreign key", async () => {
			const invalidUserId = "";
			const orgId = await createTestOrganization();

			await expect(
				server.drizzleClient.insert(blockedUsersTable).values({
					organizationId: orgId,
					userId: invalidUserId,
				}),
			).rejects.toThrow();
		});

		it("should reject insert with invalid orgId foreign key", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const orgId = faker.string.uuid();

			await expect(
				server.drizzleClient.insert(blockedUsersTable).values({
					organizationId: orgId,
					userId: userId,
				}),
			).rejects.toThrow();
		});

		it("should reject insert with empty orgId foreign key", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const orgId = "";

			await expect(
				server.drizzleClient.insert(blockedUsersTable).values({
					organizationId: orgId,
					userId: userId,
				}),
			).rejects.toThrow();
		});
	});

	describe("Table Relations", () => {
		type RelationCall = {
			type: "one" | "many";
			table: unknown;
			config: unknown;
			withFieldName: (fieldName: string) => RelationCall;
		};

		const createMockBuilders = () => {
			const one = (table: unknown, config: unknown): RelationCall => {
				const result: RelationCall = {
					type: "one" as const,
					table,
					config,
					withFieldName: () => result,
				};
				return result;
			};

			const many = (table: unknown, config: unknown): RelationCall => {
				const result: RelationCall = {
					type: "many" as const,
					table,
					config,
					withFieldName: () => result,
				};
				return result;
			};

			return {
				one: one as unknown as Parameters<
					typeof blockedUsersTableRelations.config
				>[0]["one"],
				many: many as unknown as Parameters<
					typeof blockedUsersTableRelations.config
				>[0]["many"],
			};
		};

		it("should define relations object", () => {
			expect(blockedUsersTableRelations).toBeDefined();
			expect(typeof blockedUsersTableRelations).toBe("object");
		});

		it("should be associated with blockedUsersTableRelations", () => {
			expect(blockedUsersTableRelations.table).toBe(blockedUsersTable);
		});

		it("should have a config function", () => {
			expect(typeof blockedUsersTableRelations.config).toBe("function");
		});

		it("should define all relations", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = blockedUsersTableRelations.config({
				one,
				many,
			});

			expect(relationsResult.organization).toBeDefined();
			expect(relationsResult.user).toBeDefined();
		});

		it("should define organization as a one-to-one relation with organizationsTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = blockedUsersTableRelations.config({
				one,
				many,
			});

			const creator = relationsResult.organization as unknown as RelationCall;
			expect(creator.type).toBe("one");
			expect(creator.table).toBe(organizationsTable);
		});

		it("should define user as a one-to-one relation with usersTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = blockedUsersTableRelations.config({
				one,
				many,
			});

			const creator = relationsResult.user as unknown as RelationCall;
			expect(creator.type).toBe("one");
			expect(creator.table).toBe(usersTable);
		});
	});

	describe("Insert Schema Validation", () => {
		it("should validate required userId & organizationId field", () => {
			const invalidData = {};
			const result = blockedUsersTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("organizationId"),
					),
				).toBe(true);
			}
		});

		it("should reject empty userId & organizationId string", () => {
			const invalidData = { userId: "", organizationId: "" };
			const result = blockedUsersTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("organizationId"),
					),
				).toBe(true);
			}
		});

		it("should reject null userId & organizationId", () => {
			const invalidData = { userId: null, organizationId: null };
			const result = blockedUsersTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("userId")),
				).toBe(true);
			}
		});

		it("should reject empty organizationId string", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const invalidData = { userId: userId, organizationId: "" };

			const result = blockedUsersTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("organizationId"),
					),
				).toBe(true);
			}
		});

		it("should reject null organizationId", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const invalidData = { userId: userId, organizationId: null };

			const result = blockedUsersTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("organizationId"),
					),
				).toBe(true);
			}
		});

		it("should reject null userId", async () => {
			const orgId = await createTestOrganization();
			const invalidData = { userId: null, organizationId: orgId };

			const result = blockedUsersTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("userId")),
				).toBe(true);
			}
		});

		it("should reject empty userId string", async () => {
			const orgId = await createTestOrganization();
			const invalidData = { userId: "", organizationId: orgId };

			const result = blockedUsersTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) => issue.path.includes("userId")),
				).toBe(true);
			}
		});

		it("should accept data with valid data", () => {
			const validData = {
				organizationId: faker.string.uuid(),
				userId: faker.string.uuid(),
			};
			const result = blockedUsersTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});
	});

	describe("Database Operations", () => {
		it("should successfully insert a record with required fields", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const orgId = await createTestOrganization();

			const [result] = await server.drizzleClient
				.insert(blockedUsersTable)
				.values({
					organizationId: orgId,
					userId: userId,
				})
				.returning();

			expect(result).toBeDefined();
			if (!result) {
				throw new Error("Insert did not return a result");
			}

			expect(result.id).toBeDefined();
			expect(result.organizationId).toBe(orgId);
			expect(result.userId).toBe(userId);
		});

		it("should successfully query records", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const orgId = await createTestOrganization();

			await server.drizzleClient
				.insert(blockedUsersTable)
				.values({
					organizationId: orgId,
					userId: userId,
				})
				.returning();

			const results = await server.drizzleClient
				.select()
				.from(blockedUsersTable)
				.where(eq(blockedUsersTable.userId, userId));

			expect(Array.isArray(results)).toBe(true);
			expect(results.length).toBeGreaterThan(0);
			expect(results[0]?.userId).toBe(userId);
		});

		it("should successfully delete a record", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const orgId = await createTestOrganization();

			const [inserted] = await server.drizzleClient
				.insert(blockedUsersTable)
				.values({
					organizationId: orgId,
					userId: userId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert record");
			}

			const blockUserId = inserted.id;

			const [deleted] = await server.drizzleClient
				.delete(blockedUsersTable)
				.where(eq(blockedUsersTable.id, blockUserId))
				.returning();

			expect(deleted).toBeDefined();
			expect(deleted?.id).toBe(blockUserId);

			const [verifyDeleted] = await server.drizzleClient
				.select()
				.from(blockedUsersTable)
				.where(eq(blockedUsersTable.id, blockUserId))
				.limit(1);

			expect(verifyDeleted).toBeUndefined();
		});

		it("should not find blockUser after user deletion", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const orgId = await createTestOrganization();

			const [inserted] = await server.drizzleClient
				.insert(blockedUsersTable)
				.values({
					organizationId: orgId,
					userId: userId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert record");
			}

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, userId));

			const [verifyDeleted] = await server.drizzleClient
				.select()
				.from(blockedUsersTable)
				.where(eq(blockedUsersTable.userId, userId))
				.limit(1);

			expect(verifyDeleted).toBeUndefined();
		});

		it("should not find blockUser after organization deletion", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const orgId = await createTestOrganization();

			const [inserted] = await server.drizzleClient
				.insert(blockedUsersTable)
				.values({
					organizationId: orgId,
					userId: userId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert record");
			}

			await server.drizzleClient
				.delete(organizationsTable)
				.where(eq(organizationsTable.id, orgId));

			const [verifyDeleted] = await server.drizzleClient
				.select()
				.from(blockedUsersTable)
				.where(eq(blockedUsersTable.organizationId, orgId))
				.limit(1);

			expect(verifyDeleted).toBeUndefined();
		});
	});

	describe("Index Configuration", () => {
		it("should successfully query by userId column", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const orgId = await createTestOrganization();

			await server.drizzleClient
				.insert(blockedUsersTable)
				.values({
					organizationId: orgId,
					userId: userId,
				})
				.returning();

			const results = await server.drizzleClient
				.select()
				.from(blockedUsersTable)
				.where(eq(blockedUsersTable.userId, userId));

			expect(results.length).toBeGreaterThan(0);
		});

		it("should successfully query by organizationId column", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const orgId = await createTestOrganization();

			await server.drizzleClient
				.insert(blockedUsersTable)
				.values({
					organizationId: orgId,
					userId: userId,
				})
				.returning();

			const results = await server.drizzleClient
				.select()
				.from(blockedUsersTable)
				.where(eq(blockedUsersTable.organizationId, orgId));

			expect(results.length).toBeGreaterThan(0);
		});

		it("should not allow duplicate blockuser by same user on same organization", async () => {
			const { userId } = await createRegularUserUsingAdmin();
			const orgId = await createTestOrganization();

			await server.drizzleClient
				.insert(blockedUsersTable)
				.values({
					organizationId: orgId,
					userId: userId,
				})
				.returning();

			await expect(
				server.drizzleClient
					.insert(blockedUsersTable)
					.values({
						organizationId: orgId,
						userId: userId,
					})
					.returning(),
			).rejects.toThrow();
		});
	});
});
