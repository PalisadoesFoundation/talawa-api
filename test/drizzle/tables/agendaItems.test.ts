import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { mercuriusClient } from "test/graphql/types/client";
import {
	Mutation_createOrganization,
	Query_signIn,
} from "test/graphql/types/documentNodes";
import { assertToBeNonNullish } from "test/helpers";
import { describe, expect, it } from "vitest";
import {
	agendaCategoriesTable,
	agendaFoldersTable,
	eventsTable,
	usersTable,
} from "~/src/drizzle/schema";
import {
	AGENDA_ITEM_DESCRIPTION_MAX_LENGTH,
	AGENDA_ITEM_NAME_MAX_LENGTH,
	AGENDA_ITEM_NOTES_MAX_LENGTH,
	agendaItemsTable,
	agendaItemsTableInsertSchema,
	agendaItemsTableRelations,
} from "~/src/drizzle/tables/agendaItems";
import { server } from "../../server";

async function createTestOrganization(): Promise<string> {
	mercuriusClient.setHeaders({});
	const signIn = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});
	if (signIn.errors) {
		throw new Error(`Admin sign-in failed: ${JSON.stringify(signIn.errors)}`);
	}
	const token = signIn.data?.signIn?.authenticationToken;
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

async function createTestEvent(orgId: string): Promise<string> {
	const [event] = await server.drizzleClient
		.insert(eventsTable)
		.values({
			organizationId: orgId,
			name: `Event-${Date.now()}`,
			startAt: new Date(),
			endAt: new Date(Date.now() + 3600000),
		})
		.returning();
	if (!event) {
		throw new Error("Failed to create test event");
	}
	return event.id;
}

async function createTestAgendaCategory(
	orgId: string,
	eventId: string,
): Promise<string> {
	const [category] = await server.drizzleClient
		.insert(agendaCategoriesTable)
		.values({
			organizationId: orgId,
			eventId: eventId,
			name: `Category-${Date.now()}`,
		})
		.returning();
	if (!category) {
		throw new Error("Failed to create test agenda category");
	}
	return category.id;
}

async function createTestAgendaFolder(
	orgId: string,
	eventId: string,
): Promise<string> {
	const [folder] = await server.drizzleClient
		.insert(agendaFoldersTable)
		.values({
			organizationId: orgId,
			eventId: eventId,
			name: `Folder-${Date.now()}`,
		})
		.returning();
	if (!folder) {
		throw new Error("Failed to create test agenda folder");
	}
	return folder.id;
}

describe("src/drizzle/tables/agendaItems.ts", () => {
	describe("agendaItems Table Schema", () => {
		it("should have the correct schema", () => {
			const columns = Object.keys(agendaItemsTable);
			expect(columns).toContain("id");
			expect(columns).toContain("createdAt");
			expect(columns).toContain("updatedAt");
			expect(columns).toContain("creatorId");
			expect(columns).toContain("updaterId");
			expect(columns).toContain("categoryId");
			expect(columns).toContain("eventId");
			expect(columns).toContain("folderId");
			expect(columns).toContain("name");
			expect(columns).toContain("description");
			expect(columns).toContain("duration");
			expect(columns).toContain("key");
			expect(columns).toContain("notes");
			expect(columns).toContain("sequence");
			expect(columns).toContain("type");
		});

		it("should have correct primary key configuration", () => {
			expect(agendaItemsTable.id.primary).toBe(true);
		});

		it("should have required fields configured as not null", () => {
			expect(agendaItemsTable.createdAt.notNull).toBe(true);
			expect(agendaItemsTable.categoryId.notNull).toBe(true);
			expect(agendaItemsTable.eventId.notNull).toBe(true);
			expect(agendaItemsTable.folderId.notNull).toBe(true);
			expect(agendaItemsTable.name.notNull).toBe(true);
			expect(agendaItemsTable.sequence.notNull).toBe(true);
			expect(agendaItemsTable.type.notNull).toBe(true);
		});

		it("should have default values configured", () => {
			expect(agendaItemsTable.createdAt.hasDefault).toBe(true);
			expect(agendaItemsTable.id.hasDefault).toBe(true);
		});
	});

	describe("Foreign Key Relationships", () => {
		it("should reject insert with invalid categoryId foreign key", async () => {
			const orgId = await createTestOrganization();
			const eventId = await createTestEvent(orgId);
			const folderId = await createTestAgendaFolder(orgId, eventId);

			await expect(
				server.drizzleClient.insert(agendaItemsTable).values({
					categoryId: faker.string.uuid(),
					eventId: eventId,
					folderId: folderId,
					name: "Test Agenda Item",
					sequence: 1,
					type: "general",
				}),
			).rejects.toThrow();
		});

		it("should reject insert with invalid eventId foreign key", async () => {
			const orgId = await createTestOrganization();
			const eventId = await createTestEvent(orgId);
			const categoryId = await createTestAgendaCategory(orgId, eventId);
			const folderId = await createTestAgendaFolder(orgId, eventId);

			await expect(
				server.drizzleClient.insert(agendaItemsTable).values({
					categoryId: categoryId,
					eventId: faker.string.uuid(),
					folderId: folderId,
					name: "Test Agenda Item",
					sequence: 1,
					type: "general",
				}),
			).rejects.toThrow();
		});

		it("should reject insert with invalid folderId foreign key", async () => {
			const orgId = await createTestOrganization();
			const eventId = await createTestEvent(orgId);
			const categoryId = await createTestAgendaCategory(orgId, eventId);

			await expect(
				server.drizzleClient.insert(agendaItemsTable).values({
					categoryId: categoryId,
					eventId: eventId,
					folderId: faker.string.uuid(),
					name: "Test Agenda Item",
					sequence: 1,
					type: "general",
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
					typeof agendaItemsTableRelations.config
				>[0]["one"],
				many: many as unknown as Parameters<
					typeof agendaItemsTableRelations.config
				>[0]["many"],
			};
		};

		it("should define relations object", () => {
			expect(agendaItemsTableRelations).toBeDefined();
			expect(typeof agendaItemsTableRelations).toBe("object");
		});

		it("should be associated with agendaItemsTable", () => {
			expect(agendaItemsTableRelations.table).toBe(agendaItemsTable);
		});

		it("should have a config function", () => {
			expect(typeof agendaItemsTableRelations.config).toBe("function");
		});

		it("should define all relations", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = agendaItemsTableRelations.config({
				one,
				many,
			});

			expect(relationsResult.creator).toBeDefined();
			expect(relationsResult.updater).toBeDefined();
			expect(relationsResult.category).toBeDefined();
			expect(relationsResult.event).toBeDefined();
			expect(relationsResult.folder).toBeDefined();
			expect(relationsResult.attachmentsWhereAgendaItem).toBeDefined();
			expect(relationsResult.urlsWhereAgendaItem).toBeDefined();
		});

		it("should define creator as a one-to-one relation with usersTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = agendaItemsTableRelations.config({
				one,
				many,
			});

			const creator = relationsResult.creator as unknown as RelationCall;
			expect(creator.type).toBe("one");
			expect(creator.table).toBe(usersTable);
		});

		it("should define category as a one-to-one relation with agendaCategoriesTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = agendaItemsTableRelations.config({
				one,
				many,
			});

			const category = relationsResult.category as unknown as RelationCall;
			expect(category.type).toBe("one");
			expect(category.table).toBe(agendaCategoriesTable);
		});

		it("should define event as a one-to-one relation with eventsTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = agendaItemsTableRelations.config({
				one,
				many,
			});

			const event = relationsResult.event as unknown as RelationCall;
			expect(event.type).toBe("one");
			expect(event.table).toBe(eventsTable);
		});

		it("should define folder as a one-to-one relation with agendaFoldersTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = agendaItemsTableRelations.config({
				one,
				many,
			});

			const folder = relationsResult.folder as unknown as RelationCall;
			expect(folder.type).toBe("one");
			expect(folder.table).toBe(agendaFoldersTable);
		});

		it("should define updater as a one-to-one relation with usersTable", () => {
			const { one, many } = createMockBuilders();
			const relationsResult = agendaItemsTableRelations.config({
				one,
				many,
			});

			const updater = relationsResult.updater as unknown as RelationCall;
			expect(updater.type).toBe("one");
			expect(updater.table).toBe(usersTable);
		});
	});

	describe("Insert Schema Validation", () => {
		const validData = {
			categoryId: faker.string.uuid(),
			eventId: faker.string.uuid(),
			folderId: faker.string.uuid(),
			name: "Test Agenda Item",
			sequence: 1,
			type: "general",
		};

		it("should validate required categoryId field", () => {
			const invalidData = { ...validData };
			// @ts-expect-error - Testing missing required field
			delete invalidData.categoryId;
			const result = agendaItemsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
			if (!result.success) {
				expect(
					result.error.issues.some((issue) =>
						issue.path.includes("categoryId"),
					),
				).toBe(true);
			}
		});

		it("should reject empty categoryId string", () => {
			const invalidData = { ...validData, categoryId: "" };
			const result = agendaItemsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it("should reject null categoryId", () => {
			const invalidData = { ...validData, categoryId: null };
			const result = agendaItemsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it("should validate required eventId field", () => {
			const invalidData = { ...validData };
			// @ts-expect-error - Testing missing required field
			delete invalidData.eventId;
			const result = agendaItemsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it("should reject empty eventId string", () => {
			const invalidData = { ...validData, eventId: "" };
			const result = agendaItemsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it("should reject null eventId", () => {
			const invalidData = { ...validData, eventId: null };
			const result = agendaItemsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it("should validate required folderId field", () => {
			const invalidData = { ...validData };
			// @ts-expect-error - Testing missing required field
			delete invalidData.folderId;
			const result = agendaItemsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it("should reject empty folderId string", () => {
			const invalidData = { ...validData, folderId: "" };
			const result = agendaItemsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it("should reject null folderId", () => {
			const invalidData = { ...validData, folderId: null };
			const result = agendaItemsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it("should validate required name field", () => {
			const invalidData = { ...validData };
			// @ts-expect-error - Testing missing required field
			delete invalidData.name;
			const result = agendaItemsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it("should reject empty name string", () => {
			const invalidData = { ...validData, name: "" };
			const result = agendaItemsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it("should reject null name", () => {
			const invalidData = { ...validData, name: null };
			const result = agendaItemsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it("should reject name exceeding max length", () => {
			const invalidData = {
				...validData,
				name: "a".repeat(AGENDA_ITEM_NAME_MAX_LENGTH + 1),
			};
			const result = agendaItemsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it("should accept name at max length", () => {
			const data = {
				...validData,
				name: "a".repeat(AGENDA_ITEM_NAME_MAX_LENGTH),
			};
			const result = agendaItemsTableInsertSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it("should validate required sequence field", () => {
			const invalidData = { ...validData };
			// @ts-expect-error - Testing missing required field
			delete invalidData.sequence;
			const result = agendaItemsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it("should reject zero sequence", () => {
			const invalidData = { ...validData, sequence: 0 };
			const result = agendaItemsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it("should reject negative sequence", () => {
			const invalidData = { ...validData, sequence: -1 };
			const result = agendaItemsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it("should reject non-integer sequence", () => {
			const invalidData = { ...validData, sequence: 1.5 };
			const result = agendaItemsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it("should validate required type field", () => {
			const invalidData = { ...validData };
			// @ts-expect-error - Testing missing required field
			delete invalidData.type;
			const result = agendaItemsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it("should reject null type", () => {
			const invalidData = { ...validData, type: null };
			const result = agendaItemsTableInsertSchema.safeParse(invalidData);
			expect(result.success).toBe(false);
		});

		it("should accept data with valid data", () => {
			const result = agendaItemsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

		it("should accept optional description", () => {
			const data = { ...validData, description: "A valid description" };
			const result = agendaItemsTableInsertSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it("should reject empty description", () => {
			const data = { ...validData, description: "" };
			const result = agendaItemsTableInsertSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it("should reject description exceeding max length", () => {
			const data = {
				...validData,
				description: "a".repeat(AGENDA_ITEM_DESCRIPTION_MAX_LENGTH + 1),
			};
			const result = agendaItemsTableInsertSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it("should accept optional notes", () => {
			const data = { ...validData, notes: "Some notes" };
			const result = agendaItemsTableInsertSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it("should reject notes exceeding max length", () => {
			const data = {
				...validData,
				notes: "a".repeat(AGENDA_ITEM_NOTES_MAX_LENGTH + 1),
			};
			const result = agendaItemsTableInsertSchema.safeParse(data);
			expect(result.success).toBe(false);
		});

		it("should accept optional duration", () => {
			const data = { ...validData, duration: "30 minutes" };
			const result = agendaItemsTableInsertSchema.safeParse(data);
			expect(result.success).toBe(true);
		});

		it("should accept optional key", () => {
			const data = { ...validData, key: "C major" };
			const result = agendaItemsTableInsertSchema.safeParse(data);
			expect(result.success).toBe(true);
		});
	});

	describe("Database Operations", () => {
		it("should successfully insert a record with required fields", async () => {
			const orgId = await createTestOrganization();
			const eventId = await createTestEvent(orgId);
			const categoryId = await createTestAgendaCategory(orgId, eventId);
			const folderId = await createTestAgendaFolder(orgId, eventId);

			const [result] = await server.drizzleClient
				.insert(agendaItemsTable)
				.values({
					categoryId: categoryId,
					eventId: eventId,
					folderId: folderId,
					name: "Test Agenda Item",
					sequence: 1,
					type: "general",
				})
				.returning();

			expect(result).toBeDefined();
			if (!result) {
				throw new Error("Insert did not return a result");
			}

			expect(result.id).toBeDefined();
			expect(result.categoryId).toBe(categoryId);
			expect(result.eventId).toBe(eventId);
			expect(result.folderId).toBe(folderId);
			expect(result.name).toBe("Test Agenda Item");
			expect(result.sequence).toBe(1);
			expect(result.type).toBe("general");
		});

		it("should successfully query records", async () => {
			const orgId = await createTestOrganization();
			const eventId = await createTestEvent(orgId);
			const categoryId = await createTestAgendaCategory(orgId, eventId);
			const folderId = await createTestAgendaFolder(orgId, eventId);

			const [inserted] = await server.drizzleClient
				.insert(agendaItemsTable)
				.values({
					categoryId: categoryId,
					eventId: eventId,
					folderId: folderId,
					name: "Query Test Item",
					sequence: 1,
					type: "general",
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert record");
			}

			const results = await server.drizzleClient
				.select()
				.from(agendaItemsTable)
				.where(eq(agendaItemsTable.id, inserted.id));

			expect(Array.isArray(results)).toBe(true);
			expect(results.length).toBeGreaterThan(0);
			expect(results[0]?.name).toBe("Query Test Item");
		});

		it("should successfully delete a record", async () => {
			const orgId = await createTestOrganization();
			const eventId = await createTestEvent(orgId);
			const categoryId = await createTestAgendaCategory(orgId, eventId);
			const folderId = await createTestAgendaFolder(orgId, eventId);

			const [inserted] = await server.drizzleClient
				.insert(agendaItemsTable)
				.values({
					categoryId: categoryId,
					eventId: eventId,
					folderId: folderId,
					name: "Delete Test Item",
					sequence: 1,
					type: "general",
				})
				.returning();

			expect(inserted).toBeDefined();
			if (!inserted) {
				throw new Error("Failed to insert record");
			}

			const agendaItemId = inserted.id;

			const [deleted] = await server.drizzleClient
				.delete(agendaItemsTable)
				.where(eq(agendaItemsTable.id, agendaItemId))
				.returning();

			expect(deleted).toBeDefined();
			expect(deleted?.id).toBe(agendaItemId);

			const [verifyDeleted] = await server.drizzleClient
				.select()
				.from(agendaItemsTable)
				.where(eq(agendaItemsTable.id, agendaItemId))
				.limit(1);

			expect(verifyDeleted).toBeUndefined();
		});

		it("should not find agendaItem after event deletion (cascade)", async () => {
			const orgId = await createTestOrganization();
			const eventId = await createTestEvent(orgId);
			const categoryId = await createTestAgendaCategory(orgId, eventId);
			const folderId = await createTestAgendaFolder(orgId, eventId);

			const [inserted] = await server.drizzleClient
				.insert(agendaItemsTable)
				.values({
					categoryId: categoryId,
					eventId: eventId,
					folderId: folderId,
					name: "Cascade Delete Test",
					sequence: 1,
					type: "general",
				})
				.returning();

			expect(inserted).toBeDefined();

			await server.drizzleClient
				.delete(eventsTable)
				.where(eq(eventsTable.id, eventId));

			const [verifyDeleted] = await server.drizzleClient
				.select()
				.from(agendaItemsTable)
				.where(eq(agendaItemsTable.eventId, eventId))
				.limit(1);

			expect(verifyDeleted).toBeUndefined();
		});

		it("should not find agendaItem after category deletion (cascade)", async () => {
			const orgId = await createTestOrganization();
			const eventId = await createTestEvent(orgId);
			const categoryId = await createTestAgendaCategory(orgId, eventId);
			const folderId = await createTestAgendaFolder(orgId, eventId);

			const [inserted] = await server.drizzleClient
				.insert(agendaItemsTable)
				.values({
					categoryId: categoryId,
					eventId: eventId,
					folderId: folderId,
					name: "Category Cascade Test",
					sequence: 1,
					type: "general",
				})
				.returning();

			expect(inserted).toBeDefined();

			await server.drizzleClient
				.delete(agendaCategoriesTable)
				.where(eq(agendaCategoriesTable.id, categoryId));

			const [verifyDeleted] = await server.drizzleClient
				.select()
				.from(agendaItemsTable)
				.where(eq(agendaItemsTable.categoryId, categoryId))
				.limit(1);

			expect(verifyDeleted).toBeUndefined();
		});
	});

	describe("Index Configuration", () => {
		const tableConfig = getTableConfig(agendaItemsTable);

		const getColumnName = (
			col: (typeof tableConfig.indexes)[0]["config"]["columns"][0] | undefined,
		): string | undefined =>
			col && "name" in col ? (col.name as string) : undefined;

		it("should have index on createdAt", () => {
			const idx = tableConfig.indexes.find(
				(i) => getColumnName(i.config.columns[0]) === "created_at",
			);
			expect(idx).toBeDefined();
		});

		it("should have index on creatorId", () => {
			const idx = tableConfig.indexes.find(
				(i) => getColumnName(i.config.columns[0]) === "creator_id",
			);
			expect(idx).toBeDefined();
		});

		it("should have index on categoryId", () => {
			const idx = tableConfig.indexes.find(
				(i) => getColumnName(i.config.columns[0]) === "category_id",
			);
			expect(idx).toBeDefined();
		});

		it("should have index on eventId", () => {
			const idx = tableConfig.indexes.find(
				(i) => getColumnName(i.config.columns[0]) === "event_id",
			);
			expect(idx).toBeDefined();
		});

		it("should have index on folderId", () => {
			const idx = tableConfig.indexes.find(
				(i) => getColumnName(i.config.columns[0]) === "folder_id",
			);
			expect(idx).toBeDefined();
		});

		it("should have index on name", () => {
			const idx = tableConfig.indexes.find(
				(i) => getColumnName(i.config.columns[0]) === "name",
			);
			expect(idx).toBeDefined();
		});

		it("should have index on type", () => {
			const idx = tableConfig.indexes.find(
				(i) => getColumnName(i.config.columns[0]) === "type",
			);
			expect(idx).toBeDefined();
		});

		it("should have exactly 7 indexes", () => {
			expect(tableConfig.indexes.length).toBe(7);
		});

		it("should successfully query by eventId column", async () => {
			const orgId = await createTestOrganization();
			const eventId = await createTestEvent(orgId);
			const categoryId = await createTestAgendaCategory(orgId, eventId);
			const folderId = await createTestAgendaFolder(orgId, eventId);

			await server.drizzleClient
				.insert(agendaItemsTable)
				.values({
					categoryId: categoryId,
					eventId: eventId,
					folderId: folderId,
					name: "Index Query Test",
					sequence: 1,
					type: "general",
				})
				.returning();

			const results = await server.drizzleClient
				.select()
				.from(agendaItemsTable)
				.where(eq(agendaItemsTable.eventId, eventId));

			expect(results.length).toBeGreaterThan(0);
		});

		it("should successfully query by categoryId column", async () => {
			const orgId = await createTestOrganization();
			const eventId = await createTestEvent(orgId);
			const categoryId = await createTestAgendaCategory(orgId, eventId);
			const folderId = await createTestAgendaFolder(orgId, eventId);

			await server.drizzleClient
				.insert(agendaItemsTable)
				.values({
					categoryId: categoryId,
					eventId: eventId,
					folderId: folderId,
					name: "Category Query Test",
					sequence: 1,
					type: "general",
				})
				.returning();

			const results = await server.drizzleClient
				.select()
				.from(agendaItemsTable)
				.where(eq(agendaItemsTable.categoryId, categoryId));

			expect(results.length).toBeGreaterThan(0);
		});
	});

	describe("Constants", () => {
		it("AGENDA_ITEM_DESCRIPTION_MAX_LENGTH should be 2048", () => {
			expect(AGENDA_ITEM_DESCRIPTION_MAX_LENGTH).toBe(2048);
		});

		it("AGENDA_ITEM_NAME_MAX_LENGTH should be 256", () => {
			expect(AGENDA_ITEM_NAME_MAX_LENGTH).toBe(256);
		});

		it("AGENDA_ITEM_NOTES_MAX_LENGTH should be 2048", () => {
			expect(AGENDA_ITEM_NOTES_MAX_LENGTH).toBe(2048);
		});
	});
});
