import { faker } from "@faker-js/faker";
import { hash } from "@node-rs/argon2";
import { and, eq, getTableName, gte, lte, SQL } from "drizzle-orm";
import { getTableConfig, type PgColumn } from "drizzle-orm/pg-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { familyMembershipRoleEnum } from "~/src/drizzle/enums/familyMembershipRole";
import { familiesTable } from "~/src/drizzle/tables/families";
import {
	familyMembershipsTable,
	familyMembershipsTableRelations,
} from "~/src/drizzle/tables/familyMemberships";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { usersTable } from "~/src/drizzle/tables/users";
import { server } from "../../server";

/**
 * Type for columns with defaultFn
 */
type ColumnWithDefaultFn = PgColumn & {
	defaultFn?: () => unknown;
};

/**
 * Type for columns with onUpdateFn
 */
type ColumnWithOnUpdateFn = PgColumn & {
	onUpdateFn?: () => unknown;
};

/**
 * Tests for familyMemberships table definition - validates table schema, relations, insert schema validation,
 * database operations, indexes, and enum constraints.
 * This ensures the familyMemberships table is properly configured and all code paths are covered.
 */
describe("src/drizzle/tables/familyMemberships.ts - Table Definition Tests", () => {
	/**
	 * Helper function to create a test organization for foreign key references.
	 */
	async function createTestOrganization() {
		const [organizationRow] = await server.drizzleClient
			.insert(organizationsTable)
			.values({
				name: `${faker.company.name()}-${faker.string.uuid()}`,
				countryCode: "us",
				userRegistrationRequired: false,
			})
			.returning({ id: organizationsTable.id });

		if (!organizationRow?.id) {
			throw new Error("Failed to create test organization");
		}

		return organizationRow.id;
	}

	/**
	 * Helper function to create a test user for foreign key references.
	 */
	async function createTestUser() {
		const testEmail = `test.user.${faker.string.ulid()}@email.com`;
		const testPassword = "password";
		const hashedPassword = await hash(testPassword);

		const [userRow] = await server.drizzleClient
			.insert(usersTable)
			.values({
				emailAddress: testEmail,
				passwordHash: hashedPassword,
				role: "regular",
				name: faker.person.fullName(),
				isEmailAddressVerified: true,
			})
			.returning({ id: usersTable.id });

		if (!userRow?.id) {
			throw new Error("Failed to create test user");
		}

		return userRow.id;
	}

	/**
	 * Helper function to create a test family for foreign key references.
	 */
	async function createTestFamily(organizationId: string, creatorId?: string) {
		const [familyRow] = await server.drizzleClient
			.insert(familiesTable)
			.values({
				name: `${faker.person.lastName()} Family-${faker.string.uuid()}`,
				organizationId,
				creatorId,
			})
			.returning({ id: familiesTable.id });

		if (!familyRow?.id) {
			throw new Error("Failed to create test family");
		}

		return familyRow.id;
	}

	describe("Table Schema", () => {
		it("should have correct table name", () => {
			expect(getTableName(familyMembershipsTable)).toBe("family_memberships");
		});

		it("should have all required columns defined", () => {
			const columns = Object.keys(familyMembershipsTable);
			expect(columns).toContain("createdAt");
			expect(columns).toContain("creatorId");
			expect(columns).toContain("familyId");
			expect(columns).toContain("memberId");
			expect(columns).toContain("role");
			expect(columns).toContain("updatedAt");
			expect(columns).toContain("updaterId");
		});

		it("should have correct primary key configuration", () => {
			const tableConfig = getTableConfig(familyMembershipsTable);
			// Composite primary key should have 2 columns
			expect(tableConfig.primaryKeys).toHaveLength(1);
			const primaryKey = tableConfig.primaryKeys[0];
			expect(primaryKey).toBeDefined();
			if (!primaryKey) {
				throw new Error("Primary key not found");
			}
			const pkColumns = primaryKey.columns;
			expect(pkColumns).toHaveLength(2);
			const columnNames = pkColumns.map((col: { name: string }) => col.name);
			expect(columnNames).toContain("family_id");
			expect(columnNames).toContain("member_id");
		});

		it("should have required fields configured as not null", () => {
			expect(familyMembershipsTable.familyId.notNull).toBe(true);
			expect(familyMembershipsTable.memberId.notNull).toBe(true);
			expect(familyMembershipsTable.role.notNull).toBe(true);
			expect(familyMembershipsTable.createdAt.notNull).toBe(true);
		});

		it("should have optional fields configured as nullable", () => {
			expect(familyMembershipsTable.creatorId.notNull).toBe(false);
			expect(familyMembershipsTable.updaterId.notNull).toBe(false);
			expect(familyMembershipsTable.updatedAt.notNull).toBe(false);
		});

		it("should have default values configured", () => {
			expect(familyMembershipsTable.createdAt.hasDefault).toBe(true);
		});

		it("should have correct column data types", () => {
			expect(familyMembershipsTable.familyId.dataType).toBe("string");
			expect(familyMembershipsTable.familyId.columnType).toBe("PgUUID");
			expect(familyMembershipsTable.memberId.dataType).toBe("string");
			expect(familyMembershipsTable.memberId.columnType).toBe("PgUUID");
			expect(familyMembershipsTable.role.dataType).toBe("string");
			expect(familyMembershipsTable.role.columnType).toBe("PgText");
			expect(familyMembershipsTable.createdAt.dataType).toBe("date");
			expect(familyMembershipsTable.createdAt.columnType).toBe("PgTimestamp");
		});

		it("should have correct foreign key relationships", () => {
			const tableConfig = getTableConfig(familyMembershipsTable);
			expect(tableConfig.foreignKeys).toHaveLength(4);

			// Test creatorId foreign key
			const creatorFk = tableConfig.foreignKeys.find(
				(fk: { reference: () => { columns: Array<{ name: string }> } }) => {
					const ref = fk.reference();
					return ref.columns.some(
						(col: { name: string }) => col.name === "creator_id",
					);
				},
			);
			expect(creatorFk).toBeDefined();
			expect(creatorFk?.onDelete).toBe("set null");
			expect(creatorFk?.onUpdate).toBe("cascade");
			const creatorRef = creatorFk?.reference();
			expect(creatorRef?.foreignTable).toBe(usersTable);
			expect(creatorRef?.foreignColumns[0]?.name).toBe("id");

			// Test familyId foreign key
			const familyFk = tableConfig.foreignKeys.find(
				(fk: { reference: () => { columns: Array<{ name: string }> } }) => {
					const ref = fk.reference();
					return ref.columns.some(
						(col: { name: string }) => col.name === "family_id",
					);
				},
			);
			expect(familyFk).toBeDefined();
			expect(familyFk?.onDelete).toBe("cascade");
			expect(familyFk?.onUpdate).toBe("cascade");
			const familyRef = familyFk?.reference();
			expect(familyRef?.foreignTable).toBe(familiesTable);
			expect(familyRef?.foreignColumns[0]?.name).toBe("id");

			// Test memberId foreign key
			const memberFk = tableConfig.foreignKeys.find(
				(fk: { reference: () => { columns: Array<{ name: string }> } }) => {
					const ref = fk.reference();
					return ref.columns.some(
						(col: { name: string }) => col.name === "member_id",
					);
				},
			);
			expect(memberFk).toBeDefined();
			expect(memberFk?.onDelete).toBe("cascade");
			expect(memberFk?.onUpdate).toBe("cascade");
			const memberRef = memberFk?.reference();
			expect(memberRef?.foreignTable).toBe(usersTable);
			expect(memberRef?.foreignColumns[0]?.name).toBe("id");

			// Test updaterId foreign key
			const updaterFk = tableConfig.foreignKeys.find(
				(fk: { reference: () => { columns: Array<{ name: string }> } }) => {
					const ref = fk.reference();
					return ref.columns.some(
						(col: { name: string }) => col.name === "updater_id",
					);
				},
			);
			expect(updaterFk).toBeDefined();
			expect(updaterFk?.onDelete).toBe("set null");
			expect(updaterFk?.onUpdate).toBe("cascade");
			const updaterRef = updaterFk?.reference();
			expect(updaterRef?.foreignTable).toBe(usersTable);
			expect(updaterRef?.foreignColumns[0]?.name).toBe("id");
		});

		it("should have updatedAt defaultFn that returns SQL null", () => {
			const updatedAtColumn =
				familyMembershipsTable.updatedAt as ColumnWithDefaultFn;
			expect(updatedAtColumn.defaultFn).toBeDefined();
			const defaultValue = updatedAtColumn.defaultFn?.();
			// The defaultFn returns sql`${null}` which is a SQL object
			expect(defaultValue).toBeInstanceOf(SQL);
		});

		it("should have updatedAt onUpdateFn that returns a Date", () => {
			const updatedAtColumn =
				familyMembershipsTable.updatedAt as ColumnWithOnUpdateFn;
			expect(updatedAtColumn.onUpdateFn).toBeDefined();
			const beforeCall = new Date();
			const updateValue = updatedAtColumn.onUpdateFn?.();
			const afterCall = new Date();
			expect(updateValue).toBeInstanceOf(Date);
			// Verify the date is within the expected range
			expect((updateValue as Date).getTime()).toBeGreaterThanOrEqual(
				beforeCall.getTime(),
			);
			expect((updateValue as Date).getTime()).toBeLessThanOrEqual(
				afterCall.getTime(),
			);
		});
	});

	describe("Table Relations", () => {
		it("should be defined", () => {
			expect(familyMembershipsTableRelations).toBeDefined();
		});

		it("should be associated with familyMembershipsTable", () => {
			expect(familyMembershipsTableRelations.table).toBe(
				familyMembershipsTable,
			);
		});

		it("should have a config function", () => {
			expect(typeof familyMembershipsTableRelations.config).toBe("function");
		});

		describe("relation definitions", () => {
			// Type for tracking relation calls
			type RelationCall = {
				type: "one" | "many";
				table: unknown;
				config: unknown;
				withFieldName: (fieldName: string) => RelationCall;
			};

			// Helper to create mock builders that track calls
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
						typeof familyMembershipsTableRelations.config
					>[0]["one"],
					many: many as unknown as Parameters<
						typeof familyMembershipsTableRelations.config
					>[0]["many"],
				};
			};

			it("should define four relations", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = familyMembershipsTableRelations.config({
					one,
					many,
				});

				expect(relationsResult.creator).toBeDefined();
				expect(relationsResult.family).toBeDefined();
				expect(relationsResult.member).toBeDefined();
				expect(relationsResult.updater).toBeDefined();
			});

			it("should define correct one-to-one relationships", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = familyMembershipsTableRelations.config({
					one,
					many,
				});

				const creator = relationsResult.creator as unknown as RelationCall;
				expect(creator.type).toBe("one");
				expect(creator.table).toBe(usersTable);

				const family = relationsResult.family as unknown as RelationCall;
				expect(family.type).toBe("one");
				expect(family.table).toBe(familiesTable);

				const member = relationsResult.member as unknown as RelationCall;
				expect(member.type).toBe("one");
				expect(member.table).toBe(usersTable);

				const updater = relationsResult.updater as unknown as RelationCall;
				expect(updater.type).toBe("one");
				expect(updater.table).toBe(usersTable);
			});

			it("should use 'one' builder for all relations", () => {
				// Verify that all relations are created using the 'one' builder
				// by checking that they are instances of RelationCall with type "one"
				const { one, many } = createMockBuilders();
				const relationsResult = familyMembershipsTableRelations.config({
					one,
					many,
				});

				// All relations should be one-to-one (using 'one' builder)
				// Verify by checking the type property and that they were created by 'one'
				const creator = relationsResult.creator as unknown as RelationCall;
				expect(creator.type).toBe("one");
				expect(creator).toBeDefined();

				const family = relationsResult.family as unknown as RelationCall;
				expect(family.type).toBe("one");
				expect(family).toBeDefined();

				const member = relationsResult.member as unknown as RelationCall;
				expect(member.type).toBe("one");
				expect(member).toBeDefined();

				const updater = relationsResult.updater as unknown as RelationCall;
				expect(updater.type).toBe("one");
				expect(updater).toBeDefined();
			});

			it("should have correct relation names", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = familyMembershipsTableRelations.config({
					one,
					many,
				});

				const creatorConfig = relationsResult.creator as unknown as {
					config: { relationName?: string };
				};
				expect(creatorConfig.config.relationName).toBe(
					"family_memberships.creator_id:users.id",
				);

				const familyConfig = relationsResult.family as unknown as {
					config: { relationName?: string };
				};
				expect(familyConfig.config.relationName).toBe(
					"families.id:family_memberships.family_id",
				);

				const memberConfig = relationsResult.member as unknown as {
					config: { relationName?: string };
				};
				expect(memberConfig.config.relationName).toBe(
					"family_memberships.member_id:users.id",
				);

				const updaterConfig = relationsResult.updater as unknown as {
					config: { relationName?: string };
				};
				expect(updaterConfig.config.relationName).toBe(
					"family_memberships.updater_id:users.id",
				);
			});

			it("should have correct relation fields and references", () => {
				const { one, many } = createMockBuilders();
				const relationsResult = familyMembershipsTableRelations.config({
					one,
					many,
				});

				// Test creator relation fields and references
				const creatorConfig = relationsResult.creator as unknown as {
					config: {
						fields?: unknown[];
						references?: unknown[];
					};
				};
				expect(creatorConfig.config.fields).toBeDefined();
				expect(Array.isArray(creatorConfig.config.fields)).toBe(true);
				expect(creatorConfig.config.fields?.length).toBe(1);
				// Access the actual field column object to ensure coverage
				expect(creatorConfig.config.fields?.[0]).toBe(
					familyMembershipsTable.creatorId,
				);
				expect(creatorConfig.config.references).toBeDefined();
				expect(Array.isArray(creatorConfig.config.references)).toBe(true);
				expect(creatorConfig.config.references?.length).toBe(1);
				// Access the actual reference column object to ensure coverage
				expect(creatorConfig.config.references?.[0]).toBe(usersTable.id);

				// Test family relation fields and references
				const familyConfig = relationsResult.family as unknown as {
					config: {
						fields?: unknown[];
						references?: unknown[];
					};
				};
				expect(familyConfig.config.fields).toBeDefined();
				expect(Array.isArray(familyConfig.config.fields)).toBe(true);
				expect(familyConfig.config.fields?.length).toBe(1);
				// Access the actual field column object to ensure coverage
				expect(familyConfig.config.fields?.[0]).toBe(
					familyMembershipsTable.familyId,
				);
				expect(familyConfig.config.references).toBeDefined();
				expect(Array.isArray(familyConfig.config.references)).toBe(true);
				expect(familyConfig.config.references?.length).toBe(1);
				// Access the actual reference column object to ensure coverage
				expect(familyConfig.config.references?.[0]).toBe(familiesTable.id);

				// Test member relation fields and references
				const memberConfig = relationsResult.member as unknown as {
					config: {
						fields?: unknown[];
						references?: unknown[];
					};
				};
				expect(memberConfig.config.fields).toBeDefined();
				expect(Array.isArray(memberConfig.config.fields)).toBe(true);
				expect(memberConfig.config.fields?.length).toBe(1);
				// Access the actual field column object to ensure coverage
				expect(memberConfig.config.fields?.[0]).toBe(
					familyMembershipsTable.memberId,
				);
				expect(memberConfig.config.references).toBeDefined();
				expect(Array.isArray(memberConfig.config.references)).toBe(true);
				expect(memberConfig.config.references?.length).toBe(1);
				// Access the actual reference column object to ensure coverage
				expect(memberConfig.config.references?.[0]).toBe(usersTable.id);

				// Test updater relation fields and references
				const updaterConfig = relationsResult.updater as unknown as {
					config: {
						fields?: unknown[];
						references?: unknown[];
					};
				};
				expect(updaterConfig.config.fields).toBeDefined();
				expect(Array.isArray(updaterConfig.config.fields)).toBe(true);
				expect(updaterConfig.config.fields?.length).toBe(1);
				// Access the actual field column object to ensure coverage
				expect(updaterConfig.config.fields?.[0]).toBe(
					familyMembershipsTable.updaterId,
				);
				expect(updaterConfig.config.references).toBeDefined();
				expect(Array.isArray(updaterConfig.config.references)).toBe(true);
				expect(updaterConfig.config.references?.length).toBe(1);
				// Access the actual reference column object to ensure coverage
				expect(updaterConfig.config.references?.[0]).toBe(usersTable.id);
			});
		});
	});

	describe("Insert Schema Validation", () => {
		let testOrgId: string;
		let testFamilyId: string;
		let testUserId1: string;
		let testUserId2: string;

		beforeAll(async () => {
			testOrgId = await createTestOrganization();
			testUserId1 = await createTestUser();
			testUserId2 = await createTestUser();
			testFamilyId = await createTestFamily(testOrgId, testUserId1);
		});

		afterAll(async () => {
			await server.drizzleClient
				.delete(familyMembershipsTable)
				.where(eq(familyMembershipsTable.familyId, testFamilyId));

			await server.drizzleClient
				.delete(familiesTable)
				.where(eq(familiesTable.id, testFamilyId));

			await server.drizzleClient
				.delete(organizationsTable)
				.where(eq(organizationsTable.id, testOrgId));

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, testUserId1));

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, testUserId2));
		});

		it("should validate required fields", async () => {
			// Test that missing required fields are rejected
			await expect(
				server.drizzleClient.insert(familyMembershipsTable).values({
					// Missing familyId, memberId, role
				} as never),
			).rejects.toThrow();
		});

		it("should accept valid data", async () => {
			// Clean up any existing membership
			await server.drizzleClient
				.delete(familyMembershipsTable)
				.where(
					and(
						eq(familyMembershipsTable.familyId, testFamilyId),
						eq(familyMembershipsTable.memberId, testUserId2),
					),
				);

			const [membership] = await server.drizzleClient
				.insert(familyMembershipsTable)
				.values({
					familyId: testFamilyId,
					memberId: testUserId2,
					role: "adult",
				})
				.returning();

			expect(membership).toBeDefined();
			expect(membership?.familyId).toBe(testFamilyId);
			expect(membership?.memberId).toBe(testUserId2);
			expect(membership?.role).toBe("adult");
		});

		it("should validate field constraints (enum, foreign keys, composite key)", async () => {
			// Test invalid enum value
			await expect(
				server.drizzleClient.insert(familyMembershipsTable).values({
					familyId: testFamilyId,
					memberId: testUserId2,
					role: "invalid_role" as never,
				}),
			).rejects.toThrow();

			// Test invalid foreign key (familyId)
			const invalidFamilyId = faker.string.uuid();
			await expect(
				server.drizzleClient.insert(familyMembershipsTable).values({
					familyId: invalidFamilyId,
					memberId: testUserId2,
					role: "adult",
				}),
			).rejects.toThrow();

			// Test invalid foreign key (memberId)
			const invalidMemberId = faker.string.uuid();
			await expect(
				server.drizzleClient.insert(familyMembershipsTable).values({
					familyId: testFamilyId,
					memberId: invalidMemberId,
					role: "adult",
				}),
			).rejects.toThrow();

			// Test composite primary key constraint (duplicate)
			await server.drizzleClient
				.delete(familyMembershipsTable)
				.where(
					and(
						eq(familyMembershipsTable.familyId, testFamilyId),
						eq(familyMembershipsTable.memberId, testUserId2),
					),
				);

			await server.drizzleClient.insert(familyMembershipsTable).values({
				familyId: testFamilyId,
				memberId: testUserId2,
				role: "adult",
			});

			// Try to insert duplicate composite key
			await expect(
				server.drizzleClient.insert(familyMembershipsTable).values({
					familyId: testFamilyId,
					memberId: testUserId2,
					role: "child",
				}),
			).rejects.toThrow();
		});
	});

	describe("Database Operations", () => {
		let testOrgId: string;
		let testFamilyId: string;
		let testUserId1: string;
		let testUserId2: string;
		let testUserId3: string;

		beforeAll(async () => {
			testOrgId = await createTestOrganization();
			testUserId1 = await createTestUser();
			testUserId2 = await createTestUser();
			testUserId3 = await createTestUser();
			testFamilyId = await createTestFamily(testOrgId, testUserId1);
		});

		afterAll(async () => {
			await server.drizzleClient
				.delete(familyMembershipsTable)
				.where(eq(familyMembershipsTable.familyId, testFamilyId));

			await server.drizzleClient
				.delete(familiesTable)
				.where(eq(familiesTable.id, testFamilyId));

			await server.drizzleClient
				.delete(organizationsTable)
				.where(eq(organizationsTable.id, testOrgId));

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, testUserId1));

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, testUserId2));

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, testUserId3));
		});

		it("should successfully insert a record", async () => {
			// Clean up any existing membership
			await server.drizzleClient
				.delete(familyMembershipsTable)
				.where(
					and(
						eq(familyMembershipsTable.familyId, testFamilyId),
						eq(familyMembershipsTable.memberId, testUserId2),
					),
				);

			const [membership] = await server.drizzleClient
				.insert(familyMembershipsTable)
				.values({
					familyId: testFamilyId,
					memberId: testUserId2,
					role: "adult",
					creatorId: testUserId1,
				})
				.returning();

			expect(membership).toBeDefined();
			// This table uses composite primary key (familyId + memberId), not an id column
			expect(membership?.familyId).toBe(testFamilyId);
			expect(membership?.memberId).toBe(testUserId2);
			expect(membership?.role).toBe("adult");
			expect(membership?.creatorId).toBe(testUserId1);
			expect(membership?.createdAt).toBeInstanceOf(Date);
			expect(membership?.updatedAt).toBeNull();
		});

		it("should successfully query records", async () => {
			// Clean up any existing memberships for this family to make test self-contained
			await server.drizzleClient
				.delete(familyMembershipsTable)
				.where(eq(familyMembershipsTable.familyId, testFamilyId));

			// Insert a known membership record for deterministic testing
			await server.drizzleClient.insert(familyMembershipsTable).values({
				familyId: testFamilyId,
				memberId: testUserId2,
				role: "adult",
				creatorId: testUserId1,
			});

			// Query and verify
			const results = await server.drizzleClient
				.select()
				.from(familyMembershipsTable)
				.where(eq(familyMembershipsTable.familyId, testFamilyId));

			expect(Array.isArray(results)).toBe(true);
			expect(results.length).toBe(1);
			expect(results[0]?.familyId).toBe(testFamilyId);
			expect(results[0]?.memberId).toBe(testUserId2);
			expect(results[0]?.role).toBe("adult");
		});

		it("should successfully update a record", async () => {
			// Ensure membership exists
			await server.drizzleClient
				.delete(familyMembershipsTable)
				.where(
					and(
						eq(familyMembershipsTable.familyId, testFamilyId),
						eq(familyMembershipsTable.memberId, testUserId3),
					),
				);

			await server.drizzleClient
				.insert(familyMembershipsTable)
				.values({
					familyId: testFamilyId,
					memberId: testUserId3,
					role: "child",
				})
				.returning();

			const beforeUpdate = new Date();
			const [updated] = await server.drizzleClient
				.update(familyMembershipsTable)
				.set({
					role: "adult",
					updaterId: testUserId1,
				})
				.where(
					and(
						eq(familyMembershipsTable.familyId, testFamilyId),
						eq(familyMembershipsTable.memberId, testUserId3),
					),
				)
				.returning();
			const afterUpdate = new Date();

			expect(updated).toBeDefined();
			expect(updated?.role).toBe("adult");
			expect(updated?.updaterId).toBe(testUserId1);
			expect(updated?.updatedAt).toBeInstanceOf(Date);
			expect(updated?.updatedAt?.getTime()).toBeGreaterThanOrEqual(
				beforeUpdate.getTime(),
			);
			expect(updated?.updatedAt?.getTime()).toBeLessThanOrEqual(
				afterUpdate.getTime(),
			);
		});

		it("should successfully delete a record", async () => {
			// Create a membership to delete
			await server.drizzleClient
				.delete(familyMembershipsTable)
				.where(
					and(
						eq(familyMembershipsTable.familyId, testFamilyId),
						eq(familyMembershipsTable.memberId, testUserId3),
					),
				);

			await server.drizzleClient.insert(familyMembershipsTable).values({
				familyId: testFamilyId,
				memberId: testUserId3,
				role: "spouse",
			});

			const [deleted] = await server.drizzleClient
				.delete(familyMembershipsTable)
				.where(
					and(
						eq(familyMembershipsTable.familyId, testFamilyId),
						eq(familyMembershipsTable.memberId, testUserId3),
					),
				)
				.returning();

			expect(deleted).toBeDefined();
			expect(deleted?.familyId).toBe(testFamilyId);
			expect(deleted?.memberId).toBe(testUserId3);

			// Verify it's actually deleted
			const results = await server.drizzleClient
				.select()
				.from(familyMembershipsTable)
				.where(
					and(
						eq(familyMembershipsTable.familyId, testFamilyId),
						eq(familyMembershipsTable.memberId, testUserId3),
					),
				);

			expect(results).toHaveLength(0);
		});

		it("should cascade delete when family is deleted", async () => {
			// Create a temporary family and membership
			const tempOrgId = await createTestOrganization();
			const tempFamilyId = await createTestFamily(tempOrgId, testUserId1);

			await server.drizzleClient.insert(familyMembershipsTable).values({
				familyId: tempFamilyId,
				memberId: testUserId2,
				role: "adult",
			});

			// Delete the family
			await server.drizzleClient
				.delete(familiesTable)
				.where(eq(familiesTable.id, tempFamilyId));

			// Verify membership was cascade deleted
			const memberships = await server.drizzleClient
				.select()
				.from(familyMembershipsTable)
				.where(eq(familyMembershipsTable.familyId, tempFamilyId));

			expect(memberships).toHaveLength(0);

			// Cleanup
			await server.drizzleClient
				.delete(organizationsTable)
				.where(eq(organizationsTable.id, tempOrgId));
		});

		it("should cascade delete when member (user) is deleted", async () => {
			// Create a temporary user and membership
			const tempUserId = await createTestUser();
			const tempOrgId = await createTestOrganization();
			const tempFamilyId = await createTestFamily(tempOrgId, testUserId1);

			await server.drizzleClient.insert(familyMembershipsTable).values({
				familyId: tempFamilyId,
				memberId: tempUserId,
				role: "child",
			});

			// Delete the user (member)
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, tempUserId));

			// Verify membership was cascade deleted
			const memberships = await server.drizzleClient
				.select()
				.from(familyMembershipsTable)
				.where(eq(familyMembershipsTable.memberId, tempUserId));

			expect(memberships).toHaveLength(0);

			// Cleanup
			await server.drizzleClient
				.delete(familiesTable)
				.where(eq(familiesTable.id, tempFamilyId));
			await server.drizzleClient
				.delete(organizationsTable)
				.where(eq(organizationsTable.id, tempOrgId));
		});

		it("should set creatorId to null when creator is deleted", async () => {
			// Create a temporary creator user
			const tempCreatorId = await createTestUser();

			// Clean up any existing membership
			await server.drizzleClient
				.delete(familyMembershipsTable)
				.where(
					and(
						eq(familyMembershipsTable.familyId, testFamilyId),
						eq(familyMembershipsTable.memberId, testUserId2),
					),
				);

			const [membership] = await server.drizzleClient
				.insert(familyMembershipsTable)
				.values({
					familyId: testFamilyId,
					memberId: testUserId2,
					role: "adult",
					creatorId: tempCreatorId,
				})
				.returning();

			expect(membership?.creatorId).toBe(tempCreatorId);

			// Delete the creator user
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, tempCreatorId));

			// Verify creatorId was set to null
			const [updated] = await server.drizzleClient
				.select()
				.from(familyMembershipsTable)
				.where(
					and(
						eq(familyMembershipsTable.familyId, testFamilyId),
						eq(familyMembershipsTable.memberId, testUserId2),
					),
				)
				.limit(1);

			expect(updated).toBeDefined();
			expect(updated?.creatorId).toBeNull();
		});

		it("should set updaterId to null when updater is deleted", async () => {
			// Create a temporary updater user
			const tempUpdaterId = await createTestUser();

			// Clean up any existing membership
			await server.drizzleClient
				.delete(familyMembershipsTable)
				.where(
					and(
						eq(familyMembershipsTable.familyId, testFamilyId),
						eq(familyMembershipsTable.memberId, testUserId2),
					),
				);

			await server.drizzleClient.insert(familyMembershipsTable).values({
				familyId: testFamilyId,
				memberId: testUserId2,
				role: "adult",
			});

			// Update with updaterId
			await server.drizzleClient
				.update(familyMembershipsTable)
				.set({
					role: "head_of_household",
					updaterId: tempUpdaterId,
				})
				.where(
					and(
						eq(familyMembershipsTable.familyId, testFamilyId),
						eq(familyMembershipsTable.memberId, testUserId2),
					),
				);

			// Delete the updater user
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, tempUpdaterId));

			// Verify updaterId was set to null
			const [updated] = await server.drizzleClient
				.select()
				.from(familyMembershipsTable)
				.where(
					and(
						eq(familyMembershipsTable.familyId, testFamilyId),
						eq(familyMembershipsTable.memberId, testUserId2),
					),
				)
				.limit(1);

			expect(updated).toBeDefined();
			expect(updated?.updaterId).toBeNull();
		});

		it("should reject insert with invalid creatorId foreign key", async () => {
			const invalidCreatorId = faker.string.uuid();

			// Clean up any existing membership with the same composite key
			// to ensure the test fails for the correct reason (invalid FK, not PK conflict)
			await server.drizzleClient
				.delete(familyMembershipsTable)
				.where(
					and(
						eq(familyMembershipsTable.familyId, testFamilyId),
						eq(familyMembershipsTable.memberId, testUserId2),
					),
				);

			await expect(
				server.drizzleClient.insert(familyMembershipsTable).values({
					familyId: testFamilyId,
					memberId: testUserId2,
					role: "adult",
					creatorId: invalidCreatorId,
				}),
			).rejects.toThrow();
		});

		it("should reject insert with invalid updaterId foreign key", async () => {
			const invalidUpdaterId = faker.string.uuid();

			// Clean up any existing membership
			await server.drizzleClient
				.delete(familyMembershipsTable)
				.where(
					and(
						eq(familyMembershipsTable.familyId, testFamilyId),
						eq(familyMembershipsTable.memberId, testUserId2),
					),
				);

			// Insert a membership first
			await server.drizzleClient.insert(familyMembershipsTable).values({
				familyId: testFamilyId,
				memberId: testUserId2,
				role: "adult",
			});

			// Try to update with invalid updaterId
			await expect(
				server.drizzleClient
					.update(familyMembershipsTable)
					.set({
						role: "child",
						updaterId: invalidUpdaterId,
					})
					.where(
						and(
							eq(familyMembershipsTable.familyId, testFamilyId),
							eq(familyMembershipsTable.memberId, testUserId2),
						),
					),
			).rejects.toThrow();
		});
	});

	describe("Index Configuration", () => {
		const tableConfig = getTableConfig(familyMembershipsTable);

		// Helper function to get column name from indexed column
		const getColumnName = (
			col: (typeof tableConfig.indexes)[0]["config"]["columns"][0] | undefined,
		): string | undefined => {
			if (col && "name" in col) {
				return col.name as string;
			}
			return undefined;
		};

		it("should have appropriate indexes defined", () => {
			// Should have 4 indexes: createdAt, creatorId, familyId, memberId
			expect(tableConfig.indexes).toHaveLength(4);
		});

		it("should have an index on createdAt column", () => {
			const createdAtIndex = tableConfig.indexes.find(
				(idx) =>
					idx.config.columns.length === 1 &&
					getColumnName(idx.config.columns[0]) === "created_at",
			);
			expect(createdAtIndex).toBeDefined();
		});

		it("should have an index on creatorId column", () => {
			const creatorIdIndex = tableConfig.indexes.find(
				(idx) =>
					idx.config.columns.length === 1 &&
					getColumnName(idx.config.columns[0]) === "creator_id",
			);
			expect(creatorIdIndex).toBeDefined();
		});

		it("should have an index on familyId column", () => {
			const familyIdIndex = tableConfig.indexes.find(
				(idx) =>
					idx.config.columns.length === 1 &&
					getColumnName(idx.config.columns[0]) === "family_id",
			);
			expect(familyIdIndex).toBeDefined();
		});

		it("should have an index on memberId column", () => {
			const memberIdIndex = tableConfig.indexes.find(
				(idx) =>
					idx.config.columns.length === 1 &&
					getColumnName(idx.config.columns[0]) === "member_id",
			);
			expect(memberIdIndex).toBeDefined();
		});

		it("should efficiently query using indexed createdAt column", async () => {
			const testOrgId = await createTestOrganization();
			const testUserId = await createTestUser();
			const testFamilyId = await createTestFamily(testOrgId, testUserId);
			const [inserted] = await server.drizzleClient
				.insert(familyMembershipsTable)
				.values({
					familyId: testFamilyId,
					memberId: testUserId,
					role: "head_of_household",
				})
				.returning({ createdAt: familyMembershipsTable.createdAt });

			const insertedCreatedAt = inserted?.createdAt ?? new Date();

			// Query using createdAt range (indexed column)
			const results = await server.drizzleClient
				.select()
				.from(familyMembershipsTable)
				.where(
					and(
						eq(familyMembershipsTable.familyId, testFamilyId),
						gte(familyMembershipsTable.createdAt, insertedCreatedAt),
						lte(familyMembershipsTable.createdAt, insertedCreatedAt),
					),
				);

			expect(results.length).toBeGreaterThan(0);
			// Verify createdAt is within expected range (indexed column was used)
			expect(results[0]?.createdAt).toBeInstanceOf(Date);
			if (results[0]?.createdAt) {
				expect(results[0].createdAt.getTime()).toBe(
					insertedCreatedAt.getTime(),
				);
			}

			// Cleanup
			await server.drizzleClient
				.delete(familyMembershipsTable)
				.where(eq(familyMembershipsTable.familyId, testFamilyId));
			await server.drizzleClient
				.delete(familiesTable)
				.where(eq(familiesTable.id, testFamilyId));
			await server.drizzleClient
				.delete(organizationsTable)
				.where(eq(organizationsTable.id, testOrgId));
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, testUserId));
		});

		it("should efficiently query using indexed creatorId column", async () => {
			const testOrgId = await createTestOrganization();
			const testUserId1 = await createTestUser();
			const testUserId2 = await createTestUser();
			const testFamilyId = await createTestFamily(testOrgId, testUserId1);

			await server.drizzleClient.insert(familyMembershipsTable).values({
				familyId: testFamilyId,
				memberId: testUserId2,
				role: "adult",
				creatorId: testUserId1,
			});

			const results = await server.drizzleClient
				.select()
				.from(familyMembershipsTable)
				.where(eq(familyMembershipsTable.creatorId, testUserId1));

			expect(results.length).toBeGreaterThan(0);

			// Cleanup
			await server.drizzleClient
				.delete(familyMembershipsTable)
				.where(eq(familyMembershipsTable.familyId, testFamilyId));
			await server.drizzleClient
				.delete(familiesTable)
				.where(eq(familiesTable.id, testFamilyId));
			await server.drizzleClient
				.delete(organizationsTable)
				.where(eq(organizationsTable.id, testOrgId));
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, testUserId1));
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, testUserId2));
		});

		it("should efficiently query using indexed familyId column", async () => {
			const testOrgId = await createTestOrganization();
			const testUserId = await createTestUser();
			const testFamilyId = await createTestFamily(testOrgId, testUserId);

			await server.drizzleClient.insert(familyMembershipsTable).values({
				familyId: testFamilyId,
				memberId: testUserId,
				role: "head_of_household",
			});

			const results = await server.drizzleClient
				.select()
				.from(familyMembershipsTable)
				.where(eq(familyMembershipsTable.familyId, testFamilyId));

			expect(results.length).toBeGreaterThan(0);

			// Cleanup
			await server.drizzleClient
				.delete(familyMembershipsTable)
				.where(eq(familyMembershipsTable.familyId, testFamilyId));
			await server.drizzleClient
				.delete(familiesTable)
				.where(eq(familiesTable.id, testFamilyId));
			await server.drizzleClient
				.delete(organizationsTable)
				.where(eq(organizationsTable.id, testOrgId));
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, testUserId));
		});

		it("should efficiently query using indexed memberId column", async () => {
			const testOrgId = await createTestOrganization();
			const testUserId = await createTestUser();
			const testFamilyId = await createTestFamily(testOrgId, testUserId);

			await server.drizzleClient.insert(familyMembershipsTable).values({
				familyId: testFamilyId,
				memberId: testUserId,
				role: "adult",
			});

			const results = await server.drizzleClient
				.select()
				.from(familyMembershipsTable)
				.where(eq(familyMembershipsTable.memberId, testUserId));

			expect(results.length).toBeGreaterThan(0);

			// Cleanup
			await server.drizzleClient
				.delete(familyMembershipsTable)
				.where(eq(familyMembershipsTable.familyId, testFamilyId));
			await server.drizzleClient
				.delete(familiesTable)
				.where(eq(familiesTable.id, testFamilyId));
			await server.drizzleClient
				.delete(organizationsTable)
				.where(eq(organizationsTable.id, testOrgId));
			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, testUserId));
		});
	});

	describe("Enum Constraints", () => {
		let testOrgId: string;
		let testFamilyId: string;
		let testUserId1: string;
		let testUserId2: string;

		beforeAll(async () => {
			testOrgId = await createTestOrganization();
			testUserId1 = await createTestUser();
			testUserId2 = await createTestUser();
			testFamilyId = await createTestFamily(testOrgId, testUserId1);
		});

		afterAll(async () => {
			await server.drizzleClient
				.delete(familyMembershipsTable)
				.where(eq(familyMembershipsTable.familyId, testFamilyId));

			await server.drizzleClient
				.delete(familiesTable)
				.where(eq(familiesTable.id, testFamilyId));

			await server.drizzleClient
				.delete(organizationsTable)
				.where(eq(organizationsTable.id, testOrgId));

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, testUserId1));

			await server.drizzleClient
				.delete(usersTable)
				.where(eq(usersTable.id, testUserId2));
		});

		it("should enforce enum values for enum columns", () => {
			// Test that invalid enum values are rejected at the schema level
			// Note: The enum constraint is enforced at TypeScript/Drizzle level,
			// not at the PostgreSQL database level, so we test using the enum schema
			const invalidRoles = [
				"invalid_role",
				"admin",
				"member",
				"",
				"ADULT", // case sensitive
			];

			for (const invalidRole of invalidRoles) {
				const result = familyMembershipRoleEnum.safeParse(invalidRole);
				expect(result.success).toBe(false);
			}
		});

		it("should accept 'adult' enum value", async () => {
			await server.drizzleClient
				.delete(familyMembershipsTable)
				.where(
					and(
						eq(familyMembershipsTable.familyId, testFamilyId),
						eq(familyMembershipsTable.memberId, testUserId2),
					),
				);

			const [membership] = await server.drizzleClient
				.insert(familyMembershipsTable)
				.values({
					familyId: testFamilyId,
					memberId: testUserId2,
					role: "adult",
				})
				.returning();

			expect(membership?.role).toBe("adult");
		});

		it("should accept 'child' enum value", async () => {
			await server.drizzleClient
				.delete(familyMembershipsTable)
				.where(
					and(
						eq(familyMembershipsTable.familyId, testFamilyId),
						eq(familyMembershipsTable.memberId, testUserId2),
					),
				);

			const [membership] = await server.drizzleClient
				.insert(familyMembershipsTable)
				.values({
					familyId: testFamilyId,
					memberId: testUserId2,
					role: "child",
				})
				.returning();

			expect(membership?.role).toBe("child");
		});

		it("should accept 'head_of_household' enum value", async () => {
			await server.drizzleClient
				.delete(familyMembershipsTable)
				.where(
					and(
						eq(familyMembershipsTable.familyId, testFamilyId),
						eq(familyMembershipsTable.memberId, testUserId2),
					),
				);

			const [membership] = await server.drizzleClient
				.insert(familyMembershipsTable)
				.values({
					familyId: testFamilyId,
					memberId: testUserId2,
					role: "head_of_household",
				})
				.returning();

			expect(membership?.role).toBe("head_of_household");
		});

		it("should accept 'spouse' enum value", async () => {
			await server.drizzleClient
				.delete(familyMembershipsTable)
				.where(
					and(
						eq(familyMembershipsTable.familyId, testFamilyId),
						eq(familyMembershipsTable.memberId, testUserId2),
					),
				);

			const [membership] = await server.drizzleClient
				.insert(familyMembershipsTable)
				.values({
					familyId: testFamilyId,
					memberId: testUserId2,
					role: "spouse",
				})
				.returning();

			expect(membership?.role).toBe("spouse");
		});
	});
});
