import { faker } from "@faker-js/faker";
import { eq, getTableName } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { actionItemCategoriesTable } from "~/src/drizzle/tables/actionItemCategories";
import {
	actionItemsTable,
	actionItemsTableInsertSchema,
	actionItemsTableRelations,
} from "~/src/drizzle/tables/actionItems";
import { eventsTable } from "~/src/drizzle/tables/events";
import { eventVolunteerGroupsTable } from "~/src/drizzle/tables/eventVolunteerGroups";
import { eventVolunteersTable } from "~/src/drizzle/tables/eventVolunteers";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import { usersTable } from "~/src/drizzle/tables/users";
import { server } from "../../server";

describe("src/drizzle/tables/actionItems.ts - Table Definition Tests", () => {
	async function createTestActionItem(overrides?: {
		assignedAt?: Date;
		volunteerId?: string | null;
		volunteerGroupId?: string | null;
		categoryId?: string | null;
		completionAt?: Date | null;
		creatorId?: string | null;
		eventId?: string | null;
		recurringEventInstanceId?: string | null;
		isCompleted?: boolean;
		isTemplate?: boolean | null;
		organizationId?: string;
		postCompletionNotes?: string | null;
		preCompletionNotes?: string | null;
		updaterId?: string | null;
	}) {
		// Create required organization if not provided
		let organizationId = overrides?.organizationId;
		if (!organizationId) {
			const [org] = await server.drizzleClient
				.insert(organizationsTable)
				.values({
					name: faker.company.name(),
					description: faker.lorem.sentence(),
					creatorId: null,
					updaterId: null,
				})
				.returning();
			if (!org?.id) {
				throw new Error("Failed to create test organization");
			}
			organizationId = org.id;
		}

		const [actionItemRow] = await server.drizzleClient
			.insert(actionItemsTable)
			.values({
				assignedAt: overrides?.assignedAt ?? new Date(),
				volunteerId: overrides?.volunteerId ?? null,
				volunteerGroupId: overrides?.volunteerGroupId ?? null,
				categoryId: overrides?.categoryId ?? null,
				completionAt: overrides?.completionAt ?? null,
				creatorId: overrides?.creatorId ?? null,
				eventId: overrides?.eventId ?? null,
				recurringEventInstanceId: overrides?.recurringEventInstanceId ?? null,
				isCompleted: overrides?.isCompleted ?? false,
				isTemplate:
					overrides && "isTemplate" in overrides ? overrides.isTemplate : false,
				organizationId: organizationId,
				postCompletionNotes: overrides?.postCompletionNotes ?? null,
				preCompletionNotes: overrides?.preCompletionNotes ?? null,
				updaterId: overrides?.updaterId ?? null,
			})
			.returning();

		if (!actionItemRow?.id) {
			throw new Error("Failed to create test action item");
		}

		return actionItemRow;
	}

	describe("Table Schema", () => {
		it("should have correct table name", () => {
			expect(getTableName(actionItemsTable)).toBe("actionitems");
		});

		it("should have all required columns defined", () => {
			const columns = Object.keys(actionItemsTable);
			expect(columns).toContain("id");
			expect(columns).toContain("assignedAt");
			expect(columns).toContain("volunteerId");
			expect(columns).toContain("volunteerGroupId");
			expect(columns).toContain("categoryId");
			expect(columns).toContain("completionAt");
			expect(columns).toContain("createdAt");
			expect(columns).toContain("creatorId");
			expect(columns).toContain("eventId");
			expect(columns).toContain("recurringEventInstanceId");
			expect(columns).toContain("isCompleted");
			expect(columns).toContain("isTemplate");
			expect(columns).toContain("organizationId");
			expect(columns).toContain("postCompletionNotes");
			expect(columns).toContain("preCompletionNotes");
			expect(columns).toContain("updatedAt");
			expect(columns).toContain("updaterId");
		});

		it("should have correct primary key configuration", () => {
			expect(actionItemsTable.id.primary).toBe(true);
		});

		it("should have required fields configured as not null", () => {
			expect(actionItemsTable.assignedAt.notNull).toBe(true);
			expect(actionItemsTable.createdAt.notNull).toBe(true);
			expect(actionItemsTable.isCompleted.notNull).toBe(true);
			expect(actionItemsTable.organizationId.notNull).toBe(true);
		});

		it("should have optional fields configured as nullable", () => {
			expect(actionItemsTable.volunteerId.notNull).toBe(false);
			expect(actionItemsTable.volunteerGroupId.notNull).toBe(false);
			expect(actionItemsTable.categoryId.notNull).toBe(false);
			expect(actionItemsTable.completionAt.notNull).toBe(false);
			expect(actionItemsTable.creatorId.notNull).toBe(false);
			expect(actionItemsTable.eventId.notNull).toBe(false);
			expect(actionItemsTable.recurringEventInstanceId.notNull).toBe(false);
			expect(actionItemsTable.isTemplate.notNull).toBe(false);
			expect(actionItemsTable.postCompletionNotes.notNull).toBe(false);
			expect(actionItemsTable.preCompletionNotes.notNull).toBe(false);
			expect(actionItemsTable.updatedAt.notNull).toBe(false);
			expect(actionItemsTable.updaterId.notNull).toBe(false);
		});

		it("should have default values configured", () => {
			expect(actionItemsTable.createdAt.hasDefault).toBe(true);
			expect(actionItemsTable.id.hasDefault).toBe(true);
			expect(actionItemsTable.isTemplate.hasDefault).toBe(true);
		});
	});

	describe("Foreign Key Relationships", () => {
		it("should have volunteerId column defined", () => {
			expect(actionItemsTable.volunteerId).toBeDefined();
		});

		it("should have volunteerGroupId column defined", () => {
			expect(actionItemsTable.volunteerGroupId).toBeDefined();
		});

		it("should have categoryId column defined", () => {
			expect(actionItemsTable.categoryId).toBeDefined();
		});

		it("should have creatorId column defined", () => {
			expect(actionItemsTable.creatorId).toBeDefined();
		});

		it("should have eventId column defined", () => {
			expect(actionItemsTable.eventId).toBeDefined();
		});

		it("should have recurringEventInstanceId column defined", () => {
			expect(actionItemsTable.recurringEventInstanceId).toBeDefined();
		});

		it("should have organizationId column defined", () => {
			expect(actionItemsTable.organizationId).toBeDefined();
		});

		it("should have updaterId column defined", () => {
			expect(actionItemsTable.updaterId).toBeDefined();
		});

		it("should reject insert with invalid volunteerId foreign key", async () => {
			const invalidVolunteerId = faker.string.uuid();
			const [org] = await server.drizzleClient
				.insert(organizationsTable)
				.values({
					name: faker.company.name(),
					description: faker.lorem.sentence(),
					creatorId: null,
					updaterId: null,
				})
				.returning();
			if (!org?.id) {
				throw new Error("Failed to create test organization");
			}

			await expect(
				server.drizzleClient.insert(actionItemsTable).values({
					assignedAt: new Date(),
					volunteerId: invalidVolunteerId,
					organizationId: org.id,
					isCompleted: false,
				}),
			).rejects.toMatchObject({
				cause: { code: "23503" }, // PostgreSQL foreign key violation code
			});
		});

		it("should reject insert with invalid volunteerGroupId foreign key", async () => {
			const invalidVolunteerGroupId = faker.string.uuid();
			const [org] = await server.drizzleClient
				.insert(organizationsTable)
				.values({
					name: faker.company.name(),
					description: faker.lorem.sentence(),
					creatorId: null,
					updaterId: null,
				})
				.returning();
			if (!org?.id) {
				throw new Error("Failed to create test organization");
			}

			await expect(
				server.drizzleClient.insert(actionItemsTable).values({
					assignedAt: new Date(),
					volunteerGroupId: invalidVolunteerGroupId,
					organizationId: org.id,
					isCompleted: false,
				}),
			).rejects.toMatchObject({
				cause: { code: "23503" }, // PostgreSQL foreign key violation code
			});
		});

		it("should reject insert with invalid categoryId foreign key", async () => {
			const invalidCategoryId = faker.string.uuid();
			const [org] = await server.drizzleClient
				.insert(organizationsTable)
				.values({
					name: faker.company.name(),
					description: faker.lorem.sentence(),
					creatorId: null,
					updaterId: null,
				})
				.returning();
			if (!org?.id) {
				throw new Error("Failed to create test organization");
			}

			await expect(
				server.drizzleClient.insert(actionItemsTable).values({
					assignedAt: new Date(),
					categoryId: invalidCategoryId,
					organizationId: org.id,
					isCompleted: false,
				}),
			).rejects.toMatchObject({
				cause: { code: "23503" }, // PostgreSQL foreign key violation code
			});
		});

		it("should reject insert with invalid creatorId foreign key", async () => {
			const invalidCreatorId = faker.string.uuid();
			const [org] = await server.drizzleClient
				.insert(organizationsTable)
				.values({
					name: faker.company.name(),
					description: faker.lorem.sentence(),
					creatorId: null,
					updaterId: null,
				})
				.returning();
			if (!org?.id) {
				throw new Error("Failed to create test organization");
			}

			await expect(
				server.drizzleClient.insert(actionItemsTable).values({
					assignedAt: new Date(),
					creatorId: invalidCreatorId,
					organizationId: org.id,
					isCompleted: false,
				}),
			).rejects.toMatchObject({
				cause: { code: "23503" }, // PostgreSQL foreign key violation code
			});
		});

		it("should reject insert with invalid eventId foreign key", async () => {
			const invalidEventId = faker.string.uuid();
			const [org] = await server.drizzleClient
				.insert(organizationsTable)
				.values({
					name: faker.company.name(),
					description: faker.lorem.sentence(),
					creatorId: null,
					updaterId: null,
				})
				.returning();
			if (!org?.id) {
				throw new Error("Failed to create test organization");
			}

			await expect(
				server.drizzleClient.insert(actionItemsTable).values({
					assignedAt: new Date(),
					eventId: invalidEventId,
					organizationId: org.id,
					isCompleted: false,
				}),
			).rejects.toMatchObject({
				cause: { code: "23503" }, // PostgreSQL foreign key violation code
			});
		});

		it("should reject insert with invalid recurringEventInstanceId foreign key", async () => {
			const invalidRecurringEventInstanceId = faker.string.uuid();
			const [org] = await server.drizzleClient
				.insert(organizationsTable)
				.values({
					name: faker.company.name(),
					description: faker.lorem.sentence(),
					creatorId: null,
					updaterId: null,
				})
				.returning();
			if (!org?.id) {
				throw new Error("Failed to create test organization");
			}

			await expect(
				server.drizzleClient.insert(actionItemsTable).values({
					assignedAt: new Date(),
					recurringEventInstanceId: invalidRecurringEventInstanceId,
					organizationId: org.id,
					isCompleted: false,
				}),
			).rejects.toMatchObject({
				cause: { code: "23503" }, // PostgreSQL foreign key violation code
			});
		});

		it("should reject insert with invalid organizationId foreign key", async () => {
			const invalidOrganizationId = faker.string.uuid();

			await expect(
				server.drizzleClient.insert(actionItemsTable).values({
					assignedAt: new Date(),
					organizationId: invalidOrganizationId,
					isCompleted: false,
				}),
			).rejects.toMatchObject({
				cause: { code: "23503" }, // PostgreSQL foreign key violation code
			});
		});

		it("should reject insert with invalid updaterId foreign key", async () => {
			const invalidUpdaterId = faker.string.uuid();
			const [org] = await server.drizzleClient
				.insert(organizationsTable)
				.values({
					name: faker.company.name(),
					description: faker.lorem.sentence(),
					creatorId: null,
					updaterId: null,
				})
				.returning();
			if (!org?.id) {
				throw new Error("Failed to create test organization");
			}

			await expect(
				server.drizzleClient.insert(actionItemsTable).values({
					assignedAt: new Date(),
					updaterId: invalidUpdaterId,
					organizationId: org.id,
					isCompleted: false,
				}),
			).rejects.toMatchObject({
				cause: { code: "23503" }, // PostgreSQL foreign key violation code
			});
		});
	});

	describe("Table Relations", () => {
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
					typeof actionItemsTableRelations.config
				>[0]["one"],
				many: many as unknown as Parameters<
					typeof actionItemsTableRelations.config
				>[0]["many"],
			};
		};

		it("should define relations object", () => {
			expect(actionItemsTableRelations).toBeDefined();
			expect(typeof actionItemsTableRelations).toBe("object");
		});

		it("should be associated with actionItemsTable", () => {
			expect(actionItemsTableRelations.table).toBe(actionItemsTable);
		});

		it("should have a config function", () => {
			expect(typeof actionItemsTableRelations.config).toBe("function");
		});

		it("should define all expected relations", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = actionItemsTableRelations.config({ one, many });

			expect(relationsResult.volunteer).toBeDefined();
			expect(relationsResult.volunteerGroup).toBeDefined();
			expect(relationsResult.category).toBeDefined();
			expect(relationsResult.creator).toBeDefined();
			expect(relationsResult.event).toBeDefined();
			expect(relationsResult.recurringEventInstance).toBeDefined();
			expect(relationsResult.organization).toBeDefined();
			expect(relationsResult.updater).toBeDefined();
		});

		it("should define volunteer as a one-to-one relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = actionItemsTableRelations.config({
				one,
				many,
			});

			const relation = relationsResult.volunteer as unknown as RelationCall;
			expect(relation.type).toBe("one");
			expect(relation.table).toBe(eventVolunteersTable);
		});

		it("should define volunteerGroup as a one-to-one relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = actionItemsTableRelations.config({
				one,
				many,
			});

			const relation =
				relationsResult.volunteerGroup as unknown as RelationCall;
			expect(relation.type).toBe("one");
			expect(relation.table).toBe(eventVolunteerGroupsTable);
		});

		it("should define category as a one-to-one relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = actionItemsTableRelations.config({
				one,
				many,
			});

			const relation = relationsResult.category as unknown as RelationCall;
			expect(relation.type).toBe("one");
			expect(relation.table).toBe(actionItemCategoriesTable);
		});

		it("should define creator as a one-to-one relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = actionItemsTableRelations.config({
				one,
				many,
			});

			const relation = relationsResult.creator as unknown as RelationCall;
			expect(relation.type).toBe("one");
			expect(relation.table).toBe(usersTable);
		});

		it("should define event as a one-to-one relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = actionItemsTableRelations.config({
				one,
				many,
			});

			const relation = relationsResult.event as unknown as RelationCall;
			expect(relation.type).toBe("one");
			expect(relation.table).toBe(eventsTable);
		});

		it("should define recurringEventInstance as a one-to-one relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = actionItemsTableRelations.config({
				one,
				many,
			});

			const relation =
				relationsResult.recurringEventInstance as unknown as RelationCall;
			expect(relation.type).toBe("one");
			expect(relation.table).toBe(recurringEventInstancesTable);
			expect(relation.config).toEqual({
				fields: [actionItemsTable.recurringEventInstanceId],
				references: [recurringEventInstancesTable.id],
				relationName:
					"actionitems.recurring_event_instance_id:recurring_event_instances.id",
			});
		});

		it("should define organization as a one-to-one relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = actionItemsTableRelations.config({
				one,
				many,
			});

			const relation = relationsResult.organization as unknown as RelationCall;
			expect(relation.type).toBe("one");
			expect(relation.table).toBe(organizationsTable);
		});

		it("should define updater as a one-to-one relation", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = actionItemsTableRelations.config({
				one,
				many,
			});

			const relation = relationsResult.updater as unknown as RelationCall;
			expect(relation.type).toBe("one");
			expect(relation.table).toBe(usersTable);
		});
	});

	describe("Insert Schema Validation", () => {
		it("should validate required assignedAt field", () => {
			const invalidData = {
				organizationId: faker.string.uuid(),
				isCompleted: false,
			};
			const result = actionItemsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("assignedAt"),
					),
				).toBe(true);
			}
		});

		it("should validate required organizationId field", () => {
			const invalidData = { assignedAt: new Date(), isCompleted: false };
			const result = actionItemsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("organizationId"),
					),
				).toBe(true);
			}
		});

		it("should validate required isCompleted field", () => {
			const invalidData = {
				assignedAt: new Date(),
				organizationId: faker.string.uuid(),
			};
			const result = actionItemsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("isCompleted"),
					),
				).toBe(true);
			}
		});

		it("should accept valid data with required fields only", () => {
			const validData = {
				assignedAt: new Date(),
				organizationId: faker.string.uuid(),
				isCompleted: false,
			};
			const result = actionItemsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept valid data with all fields", () => {
			const validData = {
				assignedAt: new Date(),
				volunteerId: faker.string.uuid(),
				volunteerGroupId: faker.string.uuid(),
				categoryId: faker.string.uuid(),
				completionAt: new Date(),
				creatorId: faker.string.uuid(),
				eventId: faker.string.uuid(),
				recurringEventInstanceId: faker.string.uuid(),
				isCompleted: true,
				isTemplate: true,
				organizationId: faker.string.uuid(),
				postCompletionNotes: faker.lorem.sentence(),
				preCompletionNotes: faker.lorem.sentence(),
				updaterId: faker.string.uuid(),
			};
			const result = actionItemsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept null values for optional fields", () => {
			const validData = {
				assignedAt: new Date(),
				volunteerId: null,
				volunteerGroupId: null,
				categoryId: null,
				completionAt: null,
				creatorId: null,
				eventId: null,
				recurringEventInstanceId: null,
				isCompleted: false,
				isTemplate: null,
				organizationId: faker.string.uuid(),
				postCompletionNotes: null,
				preCompletionNotes: null,
				updaterId: null,
			};
			const result = actionItemsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});
	});

	describe("Index Configuration", () => {
		it("should have exact expected indexes defined", () => {
			const tableConfig = getTableConfig(actionItemsTable);
			expect(tableConfig.indexes).toBeDefined();

			// Canonical list of expected indexes by column names
			const expectedIndexes = [
				["assigned_at"],
				["volunteer_id"],
				["volunteer_group_id"],
				["category_id"],
				["completion_at"],
				["created_at"],
				["creator_id"],
				["organization_id"],
			];

			expect(tableConfig.indexes.length).toBe(expectedIndexes.length);

			// Create a set of joined column names for deterministic comparison
			const actualIndexSet = new Set(
				tableConfig.indexes.map((idx) =>
					idx.config.columns
						.map((col) => ("name" in col ? col.name : ""))
						.sort()
						.join(","),
				),
			);

			const expectedIndexSet = new Set(
				expectedIndexes.map((cols) => cols.sort().join(",")),
			);

			expect(actualIndexSet).toEqual(expectedIndexSet);

			// Verify all indexes are non-unique
			for (const idx of tableConfig.indexes) {
				expect(idx.config.unique).toBeFalsy();
			}
		});
	});

	describe("Database Operations", () => {
		it("should successfully insert a record with required fields", async () => {
			const assignedAt = new Date();
			const isCompleted = false;

			const [org] = await server.drizzleClient
				.insert(organizationsTable)
				.values({
					name: faker.company.name(),
					description: faker.lorem.sentence(),
					creatorId: null,
					updaterId: null,
				})
				.returning();
			if (!org?.id) {
				throw new Error("Failed to create test organization");
			}

			const [result] = await server.drizzleClient
				.insert(actionItemsTable)
				.values({
					assignedAt,
					organizationId: org.id,
					isCompleted,
				})
				.returning();

			expect(result).toBeDefined();
			if (!result) {
				throw new Error("Failed to insert action item record");
			}
			expect(result.id).toBeDefined();
			expect(result.assignedAt).toEqual(assignedAt);
			expect(result.organizationId).toBe(org.id);
			expect(result.isCompleted).toBe(isCompleted);
			expect(result.createdAt).toBeInstanceOf(Date);
			expect(result.updatedAt).toBeNull();
			expect(result.isTemplate).toBe(false);
		});

		it("should successfully insert a record with all optional fields", async () => {
			const assignedAt = new Date();
			const completionAt = new Date();
			const isCompleted = true;
			const isTemplate = true;
			const postCompletionNotes = faker.lorem.sentence();
			const preCompletionNotes = faker.lorem.sentence();

			const [org] = await server.drizzleClient
				.insert(organizationsTable)
				.values({
					name: faker.company.name(),
					description: faker.lorem.sentence(),
					creatorId: null,
					updaterId: null,
				})
				.returning();
			if (!org?.id) {
				throw new Error("Failed to create test organization");
			}

			const [result] = await server.drizzleClient
				.insert(actionItemsTable)
				.values({
					assignedAt,
					volunteerId: null,
					volunteerGroupId: null,
					categoryId: null,
					completionAt,
					creatorId: null,
					eventId: null,
					recurringEventInstanceId: null,
					isCompleted,
					isTemplate,
					organizationId: org.id,
					postCompletionNotes,
					preCompletionNotes,
					updaterId: null,
				})
				.returning();

			expect(result).toBeDefined();
			if (!result) {
				throw new Error("Failed to insert action item record");
			}
			expect(result.assignedAt).toEqual(assignedAt);
			expect(result.completionAt).toEqual(completionAt);
			expect(result.isCompleted).toBe(isCompleted);
			expect(result.isTemplate).toBe(isTemplate);
			expect(result.organizationId).toBe(org.id);
			expect(result.postCompletionNotes).toBe(postCompletionNotes);
			expect(result.preCompletionNotes).toBe(preCompletionNotes);
		});

		it("should successfully query records", async () => {
			// Insert a known record first
			const testActionItem = await createTestActionItem({
				preCompletionNotes: "Test query notes",
				isCompleted: true,
			});

			// Query records
			const results = await server.drizzleClient
				.select()
				.from(actionItemsTable);

			expect(Array.isArray(results)).toBe(true);
			expect(results.length).toBeGreaterThan(0);

			// Verify the inserted record is present
			const foundRecord = results.find((item) => item.id === testActionItem.id);
			expect(foundRecord).toBeDefined();
			expect(foundRecord?.preCompletionNotes).toBe("Test query notes");
			expect(foundRecord?.isCompleted).toBe(true);
		});

		it("should successfully update a record", async () => {
			const actionItem = await createTestActionItem();
			const newCompletionAt = new Date();

			const [result] = await server.drizzleClient
				.update(actionItemsTable)
				.set({
					completionAt: newCompletionAt,
					isCompleted: true,
					updaterId: null,
				})
				.where(eq(actionItemsTable.id, actionItem.id))
				.returning();

			expect(result).toBeDefined();
			if (!result) {
				throw new Error("Failed to update action item record");
			}
			expect(result.completionAt).toEqual(newCompletionAt);
			expect(result.isCompleted).toBe(true);
			expect(result.updatedAt).toBeInstanceOf(Date);
		});

		it("should successfully delete a record", async () => {
			const actionItem = await createTestActionItem();

			const [result] = await server.drizzleClient
				.delete(actionItemsTable)
				.where(eq(actionItemsTable.id, actionItem.id))
				.returning();

			expect(result).toBeDefined();
			if (!result) {
				throw new Error("Failed to delete action item record");
			}
			expect(result.id).toBe(actionItem.id);
		});
	});
});
