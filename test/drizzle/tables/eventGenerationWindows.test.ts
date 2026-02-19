import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { mercuriusClient } from "test/graphql/types/client";
import { createRegularUserUsingAdmin } from "test/graphql/types/createRegularUserUsingAdmin";
import { Mutation_createOrganization } from "test/graphql/types/documentNodes";
import { assertToBeNonNullish } from "test/helpers";
import { getAdminAuthViaRest } from "test/helpers/adminAuthRest";
import { describe, expect, it } from "vitest";
import { organizationsTable, usersTable } from "~/src/drizzle/schema";
import {
	eventGenerationWindowsTable,
	eventGenerationWindowsTableInsertSchema,
	eventGenerationWindowsTableRelations,
} from "~/src/drizzle/tables/eventGenerationWindows";
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
				name: `Org-${Date.now()}-${faker.string.alphanumeric(8)}`,
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

describe("src/drizzle/tables/eventGenerationWindows.ts", () => {
	describe("Table Schema", () => {
		it("should have all required columns defined", () => {
			const columns = Object.keys(eventGenerationWindowsTable);
			expect(columns).toContain("id");
			expect(columns).toContain("organizationId");
			expect(columns).toContain("hotWindowMonthsAhead");
			expect(columns).toContain("historyRetentionMonths");
			expect(columns).toContain("currentWindowEndDate");
			expect(columns).toContain("retentionStartDate");
			expect(columns).toContain("lastProcessedAt");
			expect(columns).toContain("lastProcessedInstanceCount");
			expect(columns).toContain("isEnabled");
			expect(columns).toContain("processingPriority");
			expect(columns).toContain("maxInstancesPerRun");
			expect(columns).toContain("configurationNotes");
			expect(columns).toContain("createdById");
			expect(columns).toContain("lastUpdatedById");
			expect(columns).toContain("createdAt");
			expect(columns).toContain("updatedAt");
		});

		it("should have correct primary key configuration", () => {
			expect(eventGenerationWindowsTable.id.primary).toBe(true);
		});

		it("should have correct NotNull configurations", () => {
			expect(eventGenerationWindowsTable.organizationId.notNull).toBe(true);
			expect(eventGenerationWindowsTable.hotWindowMonthsAhead.notNull).toBe(
				true,
			);
			expect(eventGenerationWindowsTable.historyRetentionMonths.notNull).toBe(
				true,
			);
			expect(eventGenerationWindowsTable.currentWindowEndDate.notNull).toBe(
				true,
			);
			expect(eventGenerationWindowsTable.retentionStartDate.notNull).toBe(true);
			expect(eventGenerationWindowsTable.lastProcessedAt.notNull).toBe(true);
			expect(
				eventGenerationWindowsTable.lastProcessedInstanceCount.notNull,
			).toBe(true);
			expect(eventGenerationWindowsTable.isEnabled.notNull).toBe(true);
			expect(eventGenerationWindowsTable.processingPriority.notNull).toBe(true);
			expect(eventGenerationWindowsTable.maxInstancesPerRun.notNull).toBe(true);
			expect(eventGenerationWindowsTable.createdById.notNull).toBe(true);
			expect(eventGenerationWindowsTable.createdAt.notNull).toBe(true);
		});

		it("should have correct Nullable configurations", () => {
			expect(eventGenerationWindowsTable.configurationNotes.notNull).toBe(
				false,
			);
			expect(eventGenerationWindowsTable.lastUpdatedById.notNull).toBe(false);
			expect(eventGenerationWindowsTable.updatedAt.notNull).toBe(false);
		});

		it("should have default values configured", () => {
			expect(eventGenerationWindowsTable.id.hasDefault).toBe(true);
			expect(eventGenerationWindowsTable.hotWindowMonthsAhead.hasDefault).toBe(
				true,
			);
			expect(
				eventGenerationWindowsTable.historyRetentionMonths.hasDefault,
			).toBe(true);
			expect(eventGenerationWindowsTable.lastProcessedAt.hasDefault).toBe(true);
			expect(
				eventGenerationWindowsTable.lastProcessedInstanceCount.hasDefault,
			).toBe(true);
			expect(eventGenerationWindowsTable.isEnabled.hasDefault).toBe(true);
			expect(eventGenerationWindowsTable.processingPriority.hasDefault).toBe(
				true,
			);
			expect(eventGenerationWindowsTable.maxInstancesPerRun.hasDefault).toBe(
				true,
			);
			expect(eventGenerationWindowsTable.createdAt.hasDefault).toBe(true);
		});
	});

	describe("Foreign Key Relationships", () => {
		it("should reject insert with invalid organizationId foreign key", async () => {
			const invalidOrgId = faker.string.uuid();
			const user = await createRegularUserUsingAdmin();

			await expect(
				server.drizzleClient.insert(eventGenerationWindowsTable).values({
					organizationId: invalidOrgId,
					currentWindowEndDate: new Date(),
					retentionStartDate: new Date(),
					createdById: user.userId,
				}),
			).rejects.toThrow();
		});

		it("should reject insert with invalid createdById foreign key", async () => {
			const orgId = await createTestOrganization();
			const invalidUserId = faker.string.uuid();

			await expect(
				server.drizzleClient.insert(eventGenerationWindowsTable).values({
					organizationId: orgId,
					currentWindowEndDate: new Date(),
					retentionStartDate: new Date(),
					createdById: invalidUserId,
				}),
			).rejects.toThrow();
		});

		it("should reject insert with invalid lastUpdatedById foreign key", async () => {
			const orgId = await createTestOrganization();
			const user = await createRegularUserUsingAdmin();
			const invalidUserId = faker.string.uuid();

			await expect(
				server.drizzleClient.insert(eventGenerationWindowsTable).values({
					organizationId: orgId,
					currentWindowEndDate: new Date(),
					retentionStartDate: new Date(),
					createdById: user.userId,
					lastUpdatedById: invalidUserId,
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
					typeof eventGenerationWindowsTableRelations.config
				>[0]["one"],
				many: many as unknown as Parameters<
					typeof eventGenerationWindowsTableRelations.config
				>[0]["many"],
			};
		};

		it("should define relations object", () => {
			expect(eventGenerationWindowsTableRelations).toBeDefined();
			expect(typeof eventGenerationWindowsTableRelations).toBe("object");
		});

		it("should be associated with eventGenerationWindowsTable", () => {
			expect(eventGenerationWindowsTableRelations.table).toBe(
				eventGenerationWindowsTable,
			);
		});

		it("should define all relations", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = eventGenerationWindowsTableRelations.config({
				one,
				many,
			});

			expect(relationsResult.organization).toBeDefined();
			expect(relationsResult.createdBy).toBeDefined();
			expect(relationsResult.lastUpdatedBy).toBeDefined();
		});

		it("should define organization as a one-to-one/many-to-one relation with organizationsTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = eventGenerationWindowsTableRelations.config({
				one,
				many,
			});

			const organization =
				relationsResult.organization as unknown as RelationCall;
			expect(organization.type).toBe("one");
			expect(organization.table).toBe(organizationsTable);
		});

		it("should define createdBy as a one-to-one relation with usersTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = eventGenerationWindowsTableRelations.config({
				one,
				many,
			});

			const createdBy = relationsResult.createdBy as unknown as RelationCall;
			expect(createdBy.type).toBe("one");
			expect(createdBy.table).toBe(usersTable);
		});

		it("should define lastUpdatedBy as a one-to-one relation with usersTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = eventGenerationWindowsTableRelations.config({
				one,
				many,
			});

			const lastUpdatedBy =
				relationsResult.lastUpdatedBy as unknown as RelationCall;
			expect(lastUpdatedBy.type).toBe("one");
			expect(lastUpdatedBy.table).toBe(usersTable);
		});
	});

	describe("Insert Schema Validation", () => {
		it("should validate organizationId uuid", () => {
			const invalidData = { organizationId: "invalid-uuid" };
			const result =
				eventGenerationWindowsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it("should validate hotWindowMonthsAhead min/max", () => {
			expect(
				eventGenerationWindowsTableInsertSchema.safeParse({
					hotWindowMonthsAhead: 0,
				}).success,
			).toBe(false);
			expect(
				eventGenerationWindowsTableInsertSchema.safeParse({
					hotWindowMonthsAhead: 61,
				}).success,
			).toBe(false);
		});

		it("should validate historyRetentionMonths min/max", () => {
			expect(
				eventGenerationWindowsTableInsertSchema.safeParse({
					historyRetentionMonths: -1,
				}).success,
			).toBe(false);
			expect(
				eventGenerationWindowsTableInsertSchema.safeParse({
					historyRetentionMonths: 61,
				}).success,
			).toBe(false);
		});

		it("should validate processingPriority min/max", () => {
			expect(
				eventGenerationWindowsTableInsertSchema.safeParse({
					processingPriority: 0,
				}).success,
			).toBe(false);
			expect(
				eventGenerationWindowsTableInsertSchema.safeParse({
					processingPriority: 11,
				}).success,
			).toBe(false);
		});

		it("should validate maxInstancesPerRun min/max", () => {
			expect(
				eventGenerationWindowsTableInsertSchema.safeParse({
					maxInstancesPerRun: 9,
				}).success,
			).toBe(false);
			expect(
				eventGenerationWindowsTableInsertSchema.safeParse({
					maxInstancesPerRun: 10001,
				}).success,
			).toBe(false);
		});

		it("should validate configurationNotes max length", () => {
			expect(
				eventGenerationWindowsTableInsertSchema.safeParse({
					configurationNotes: "a".repeat(1025),
				}).success,
			).toBe(false);
		});

		it("should validate lastProcessedInstanceCount min", () => {
			expect(
				eventGenerationWindowsTableInsertSchema.safeParse({
					lastProcessedInstanceCount: -1,
				}).success,
			).toBe(false);
		});

		it("should validate createdById uuid", () => {
			const invalidData = { createdById: "invalid-uuid" };
			const result =
				eventGenerationWindowsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it("should accept valid data", () => {
			const validData = {
				organizationId: faker.string.uuid(),
				hotWindowMonthsAhead: 12,
				historyRetentionMonths: 3,
				currentWindowEndDate: new Date(),
				retentionStartDate: new Date(),
				lastProcessedInstanceCount: 0,
				isEnabled: true,
				processingPriority: 5,
				maxInstancesPerRun: 1000,
				configurationNotes: "Valid note",
				createdById: faker.string.uuid(),
				lastUpdatedById: faker.string.uuid(),
			};
			const result =
				eventGenerationWindowsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});
	});

	describe("Index Configuration", () => {
		const tableConfig = getTableConfig(eventGenerationWindowsTable);

		const getColumnName = (
			col: (typeof tableConfig.indexes)[0]["config"]["columns"][0] | undefined,
		): string | undefined =>
			col && "name" in col ? (col.name as string) : undefined;

		it("should have index on organizationId", () => {
			const idx = tableConfig.indexes.find(
				(i) => getColumnName(i.config.columns[0]) === "organization_id",
			);
			expect(idx).toBeDefined();
		});

		it("should have composite index on isEnabled and processingPriority", () => {
			const idx = tableConfig.indexes.find(
				(i) =>
					i.config.columns.length === 2 &&
					i.config.columns.some((c) => getColumnName(c) === "is_enabled") &&
					i.config.columns.some(
						(c) => getColumnName(c) === "processing_priority",
					),
			);
			expect(idx).toBeDefined();
		});

		it("should have index on lastProcessedAt", () => {
			const idx = tableConfig.indexes.find(
				(i) => getColumnName(i.config.columns[0]) === "last_processed_at",
			);
			expect(idx).toBeDefined();
		});

		it("should have index on currentWindowEndDate", () => {
			const idx = tableConfig.indexes.find(
				(i) => getColumnName(i.config.columns[0]) === "current_window_end_date",
			);
			expect(idx).toBeDefined();
		});

		it("should have index on retentionStartDate", () => {
			const idx = tableConfig.indexes.find(
				(i) => getColumnName(i.config.columns[0]) === "retention_start_date",
			);
			expect(idx).toBeDefined();
		});

		it("should have composite worker processing index on isEnabled, processingPriority, and lastProcessedAt", () => {
			const idx = tableConfig.indexes.find(
				(i) =>
					i.config.columns.length === 3 &&
					i.config.columns.some((c) => getColumnName(c) === "is_enabled") &&
					i.config.columns.some(
						(c) => getColumnName(c) === "processing_priority",
					) &&
					i.config.columns.some(
						(c) => getColumnName(c) === "last_processed_at",
					),
			);
			expect(idx).toBeDefined();
		});

		it("should have exactly 6 indexes", () => {
			expect(tableConfig.indexes.length).toBe(6);
		});
	});

	describe("Database Operations", () => {
		it("should successfully insert a record with required fields", async () => {
			const orgId = await createTestOrganization();
			const user = await createRegularUserUsingAdmin();
			const now = new Date();

			const [result] = await server.drizzleClient
				.insert(eventGenerationWindowsTable)
				.values({
					organizationId: orgId,
					currentWindowEndDate: now,
					retentionStartDate: now,
					createdById: user.userId,
				})
				.returning();

			expect(result).toBeDefined();
			if (!result) throw new Error("Insert failed");

			expect(result.id).toBeDefined();
			expect(result.organizationId).toBe(orgId);
			expect(result.createdById).toBe(user.userId);
			// Verify defaults
			expect(result.hotWindowMonthsAhead).toBe(12);
			expect(result.historyRetentionMonths).toBe(3);
			expect(result.isEnabled).toBe(true);
			expect(result.processingPriority).toBe(5);
			expect(result.maxInstancesPerRun).toBe(1000);
			expect(result.lastProcessedInstanceCount).toBe(0);
		});

		it("should successfully update a record", async () => {
			const orgId = await createTestOrganization();
			const user = await createRegularUserUsingAdmin();
			const now = new Date();

			const [inserted] = await server.drizzleClient
				.insert(eventGenerationWindowsTable)
				.values({
					organizationId: orgId,
					currentWindowEndDate: now,
					retentionStartDate: now,
					createdById: user.userId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) throw new Error("Insert failed");

			const newDate = new Date();
			const [updated] = await server.drizzleClient
				.update(eventGenerationWindowsTable)
				.set({
					lastProcessedAt: newDate,
					isEnabled: false,
				})
				.where(eq(eventGenerationWindowsTable.id, inserted.id))
				.returning();

			expect(updated).toBeDefined();
			if (!updated) throw new Error("Update failed");

			expect(updated.lastProcessedAt.getTime()).toBeCloseTo(
				newDate.getTime(),
				-3,
			); // precision issues maybe
			expect(updated.isEnabled).toBe(false);
			expect(updated.updatedAt).not.toBeNull();
		});

		it("should successfully delete a record", async () => {
			const orgId = await createTestOrganization();
			const user = await createRegularUserUsingAdmin();
			const now = new Date();

			const [inserted] = await server.drizzleClient
				.insert(eventGenerationWindowsTable)
				.values({
					organizationId: orgId,
					currentWindowEndDate: now,
					retentionStartDate: now,
					createdById: user.userId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) throw new Error("Insert failed");

			await server.drizzleClient
				.delete(eventGenerationWindowsTable)
				.where(eq(eventGenerationWindowsTable.id, inserted.id));

			const result =
				await server.drizzleClient.query.eventGenerationWindowsTable.findFirst({
					where: eq(eventGenerationWindowsTable.id, inserted.id),
				});
			expect(result).toBeUndefined();
		});

		it("should auto-generate UUID when id is not provided", async () => {
			const orgId = await createTestOrganization();
			const user = await createRegularUserUsingAdmin();
			const now = new Date();

			const [result] = await server.drizzleClient
				.insert(eventGenerationWindowsTable)
				.values({
					organizationId: orgId,
					currentWindowEndDate: now,
					retentionStartDate: now,
					createdById: user.userId,
				})
				.returning();

			expect(result).toBeDefined();
			if (!result) throw new Error("Insert failed");

			// Verify UUID was auto-generated
			expect(result.id).toBeDefined();
			expect(typeof result.id).toBe("string");
			// UUIDv7 format check (basic validation)
			expect(result.id).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
			);
		});

		it("should set updatedAt to null on insert by default", async () => {
			const orgId = await createTestOrganization();
			const user = await createRegularUserUsingAdmin();
			const now = new Date();

			const [result] = await server.drizzleClient
				.insert(eventGenerationWindowsTable)
				.values({
					organizationId: orgId,
					currentWindowEndDate: now,
					retentionStartDate: now,
					createdById: user.userId,
				})
				.returning();

			expect(result).toBeDefined();
			if (!result) throw new Error("Insert failed");

			// Verify updatedAt defaults to null
			expect(result.updatedAt).toBeNull();
		});

		it("should automatically set updatedAt when record is updated", async () => {
			const orgId = await createTestOrganization();
			const user = await createRegularUserUsingAdmin();
			const now = new Date();

			// Insert record
			const [inserted] = await server.drizzleClient
				.insert(eventGenerationWindowsTable)
				.values({
					organizationId: orgId,
					currentWindowEndDate: now,
					retentionStartDate: now,
					createdById: user.userId,
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) throw new Error("Insert failed");
			expect(inserted.updatedAt).toBeNull();

			// Wait a moment to ensure timestamp difference
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Update the record
			const [updated] = await server.drizzleClient
				.update(eventGenerationWindowsTable)
				.set({
					processingPriority: 8,
				})
				.where(eq(eventGenerationWindowsTable.id, inserted.id))
				.returning();

			expect(updated).toBeDefined();
			if (!updated) throw new Error("Update failed");

			// Verify updatedAt was automatically set to a non-null date
			expect(updated.updatedAt).not.toBeNull();
			expect(updated.updatedAt).toBeInstanceOf(Date);
			if (updated.updatedAt) {
				expect(updated.updatedAt.getTime()).toBeGreaterThan(
					inserted.createdAt.getTime(),
				);
			}
		});
	});
});
