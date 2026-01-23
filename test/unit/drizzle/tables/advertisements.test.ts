import { faker } from "@faker-js/faker";
import { getTableConfig } from "drizzle-orm/pg-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { advertisementAttachmentsTable } from "~/src/drizzle/tables/advertisementAttachments";
import {
	advertisementsTable,
	advertisementsTableInsertSchema,
	advertisementsTableRelations,
} from "~/src/drizzle/tables/advertisements";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { usersTable } from "~/src/drizzle/tables/users";

describe("src/drizzle/tables/advertisements.ts", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});
	describe("advertisementsTable schema", () => {
		it("should be defined as a pgTable", () => {
			expect(advertisementsTable).toBeDefined();
			// Verify it's a drizzle table by checking for table-specific properties
			expect(advertisementsTable.id).toBeDefined();
		});

		it("should have all required columns defined", () => {
			const columns = Object.keys(advertisementsTable);
			expect(columns).toContain("id");
			expect(columns).toContain("name");
			expect(columns).toContain("description");
			expect(columns).toContain("type");
			expect(columns).toContain("startAt");
			expect(columns).toContain("endAt");
			expect(columns).toContain("organizationId");
			expect(columns).toContain("creatorId");
			expect(columns).toContain("updaterId");
			expect(columns).toContain("createdAt");
			expect(columns).toContain("updatedAt");
		});

		it("should have id as primary key", () => {
			expect(advertisementsTable.id.primary).toBe(true);
		});

		it("should have correct column configurations", () => {
			// Verify columns exist and have expected properties
			expect(advertisementsTable.id).toBeDefined();
			expect(advertisementsTable.name).toBeDefined();
			expect(advertisementsTable.description).toBeDefined();
			expect(advertisementsTable.type).toBeDefined();
			expect(advertisementsTable.startAt).toBeDefined();
			expect(advertisementsTable.endAt).toBeDefined();
			expect(advertisementsTable.organizationId).toBeDefined();
			expect(advertisementsTable.creatorId).toBeDefined();
			expect(advertisementsTable.updaterId).toBeDefined();
			expect(advertisementsTable.createdAt).toBeDefined();
			expect(advertisementsTable.updatedAt).toBeDefined();
		});

		it("should have correct not null constraints", () => {
			expect(advertisementsTable.id.notNull).toBe(true);
			expect(advertisementsTable.name.notNull).toBe(true);
			expect(advertisementsTable.type.notNull).toBe(true);
			expect(advertisementsTable.startAt.notNull).toBe(true);
			expect(advertisementsTable.endAt.notNull).toBe(true);
			expect(advertisementsTable.organizationId.notNull).toBe(true);
			expect(advertisementsTable.createdAt.notNull).toBe(true);
			// Optional fields
			expect(advertisementsTable.description.notNull).toBe(false);
			expect(advertisementsTable.creatorId.notNull).toBe(false);
			expect(advertisementsTable.updaterId.notNull).toBe(false);
			expect(advertisementsTable.updatedAt.notNull).toBe(false);
		});

		it("should have default value for createdAt", () => {
			expect(advertisementsTable.createdAt.hasDefault).toBe(true);
		});

		it("should have three foreign keys defined", () => {
			const { foreignKeys } = getTableConfig(advertisementsTable);
			expect(foreignKeys).toHaveLength(3);
		});

		it("should have creatorId referencing usersTable.id with correct actions", () => {
			const { foreignKeys } = getTableConfig(advertisementsTable);
			const creatorFk = foreignKeys.find((fk) => {
				const ref = fk.reference();
				return ref.columns.some((col) => col.name === "creator_id");
			});

			expect(creatorFk).toBeDefined();
			const ref = creatorFk?.reference();
			expect(ref).toBeDefined();
			expect(ref?.foreignTable).toBe(usersTable);
			expect(ref?.foreignColumns).toHaveLength(1);
			expect(ref?.foreignColumns[0]?.name).toBe("id");
			expect(ref?.columns).toHaveLength(1);
			expect(ref?.columns[0]?.name).toBe("creator_id");
			expect(creatorFk?.onDelete).toBe("set null");
			expect(creatorFk?.onUpdate).toBe("cascade");
		});

		it("should have organizationId referencing organizationsTable.id with correct actions", () => {
			const { foreignKeys } = getTableConfig(advertisementsTable);
			const organizationFk = foreignKeys.find((fk) => {
				const ref = fk.reference();
				return ref.columns.some((col) => col.name === "organization_id");
			});

			expect(organizationFk).toBeDefined();
			const ref = organizationFk?.reference();
			expect(ref).toBeDefined();
			expect(ref?.foreignTable).toBe(organizationsTable);
			expect(ref?.foreignColumns).toHaveLength(1);
			expect(ref?.foreignColumns[0]?.name).toBe("id");
			expect(ref?.columns).toHaveLength(1);
			expect(ref?.columns[0]?.name).toBe("organization_id");
			expect(organizationFk?.onDelete).toBe("cascade");
			expect(organizationFk?.onUpdate).toBe("cascade");
		});

		it("should have updaterId referencing usersTable.id with correct actions", () => {
			const { foreignKeys } = getTableConfig(advertisementsTable);
			const updaterFk = foreignKeys.find((fk) => {
				const ref = fk.reference();
				return ref.columns.some((col) => col.name === "updater_id");
			});

			expect(updaterFk).toBeDefined();
			const ref = updaterFk?.reference();
			expect(ref).toBeDefined();
			expect(ref?.foreignTable).toBe(usersTable);
			expect(ref?.foreignColumns).toHaveLength(1);
			expect(ref?.foreignColumns[0]?.name).toBe("id");
			expect(ref?.columns).toHaveLength(1);
			expect(ref?.columns[0]?.name).toBe("updater_id");
			expect(updaterFk?.onDelete).toBe("set null");
			expect(updaterFk?.onUpdate).toBe("cascade");
		});

		it("should have all required indexes defined", () => {
			const tableConfig = getTableConfig(advertisementsTable);

			// Verify indexes are defined
			expect(tableConfig.indexes).toBeDefined();
			expect(tableConfig.indexes.length).toBeGreaterThan(0);

			// Verify we have the expected number of indexes (5 regular + 1 unique)
			expect(tableConfig.indexes.length).toBe(6);
		});

		it("should have unique index on name and organizationId", () => {
			const tableConfig = getTableConfig(advertisementsTable);
			const uniqueIndex = tableConfig.indexes.find((idx) => idx.config.unique);

			expect(uniqueIndex).toBeDefined();
			expect(uniqueIndex?.config.unique).toBe(true);
			const uniqueColumns = uniqueIndex?.config.columns.map((col) =>
				"name" in col ? col.name : col,
			);
			expect(uniqueColumns).toEqual(["name", "organization_id"]);
		});

		it("should have index on creatorId", () => {
			const tableConfig = getTableConfig(advertisementsTable);
			const creatorIdIndex = tableConfig.indexes.find((idx) =>
				idx.config.columns.some(
					(col) =>
						"name" in col && col.name === "creator_id" && !idx.config.unique,
				),
			);
			expect(creatorIdIndex).toBeDefined();
		});

		it("should have index on endAt", () => {
			const tableConfig = getTableConfig(advertisementsTable);
			const endAtIndex = tableConfig.indexes.find((idx) =>
				idx.config.columns.some(
					(col) => "name" in col && col.name === "end_at" && !idx.config.unique,
				),
			);
			expect(endAtIndex).toBeDefined();
		});

		it("should have index on name", () => {
			const tableConfig = getTableConfig(advertisementsTable);
			const nameIndex = tableConfig.indexes.find(
				(idx) =>
					idx.config.columns.some(
						(col) => "name" in col && col.name === "name",
					) &&
					!idx.config.unique &&
					idx.config.columns.length === 1,
			);
			expect(nameIndex).toBeDefined();
		});

		it("should have index on organizationId", () => {
			const tableConfig = getTableConfig(advertisementsTable);
			const organizationIdIndex = tableConfig.indexes.find(
				(idx) =>
					idx.config.columns.some(
						(col) => "name" in col && col.name === "organization_id",
					) &&
					!idx.config.unique &&
					idx.config.columns.length === 1,
			);
			expect(organizationIdIndex).toBeDefined();
		});

		it("should have index on startAt", () => {
			const tableConfig = getTableConfig(advertisementsTable);
			const startAtIndex = tableConfig.indexes.find((idx) =>
				idx.config.columns.some(
					(col) =>
						"name" in col && col.name === "start_at" && !idx.config.unique,
				),
			);
			expect(startAtIndex).toBeDefined();
		});

		it("should have correct table name in config", () => {
			const tableConfig = getTableConfig(advertisementsTable);
			expect(tableConfig.name).toBe("advertisements");
		});
	});

	describe("advertisementsTableRelations", () => {
		it("should be defined", () => {
			expect(advertisementsTableRelations).toBeDefined();
		});

		it("should have correct relation configuration", () => {
			const config = advertisementsTableRelations.config;
			expect(config).toBeDefined();
			expect(typeof config).toBe("function");
		});

		it("should reference the correct table", () => {
			expect(advertisementsTableRelations.table).toBe(advertisementsTable);
		});

		it("should define all four relations", () => {
			// Create a mock that returns chainable objects like Drizzle expects
			const createMockRelation = () => ({
				withFieldName: vi.fn().mockReturnThis(),
			});

			const mockOne = vi.fn().mockImplementation(() => createMockRelation());
			const mockMany = vi.fn().mockImplementation(() => createMockRelation());

			// Invoke the config to exercise the relation definitions
			const result = advertisementsTableRelations.config({
				one: mockOne,
				many: mockMany,
			});

			// Verify all four relations are defined
			expect(result).toHaveProperty("attachmentsWhereAdvertisement");
			expect(result).toHaveProperty("creator");
			expect(result).toHaveProperty("organization");
			expect(result).toHaveProperty("updater");

			// Verify one() was called 3 times (creator, organization, updater)
			expect(mockOne).toHaveBeenCalledTimes(3);

			// Verify many() was called 1 time (attachmentsWhereAdvertisement)
			expect(mockMany).toHaveBeenCalledTimes(1);

			// Verify relations reference the correct target tables
			const oneCalls = mockOne.mock.calls;
			const manyCalls = mockMany.mock.calls;

			// many: attachmentsWhereAdvertisement -> advertisementAttachmentsTable
			expect(manyCalls[0]?.[0]).toBe(advertisementAttachmentsTable);

			// one: creator -> usersTable
			expect(oneCalls[0]?.[0]).toBe(usersTable);

			// one: organization -> organizationsTable
			expect(oneCalls[1]?.[0]).toBe(organizationsTable);

			// one: updater -> usersTable
			expect(oneCalls[2]?.[0]).toBe(usersTable);
		});
	});

	describe("advertisementsTableInsertSchema", () => {
		const validInput = {
			name: faker.lorem.words(3),
			type: "banner" as const,
			startAt: faker.date.soon(),
			endAt: faker.date.future(),
			organizationId: faker.string.uuid(),
		};

		describe("required fields validation", () => {
			it("should accept valid input with only required fields", () => {
				const result = advertisementsTableInsertSchema.safeParse(validInput);
				expect(result.success).toBe(true);
			});

			it("should reject missing name", () => {
				const { name, ...input } = validInput;
				const result = advertisementsTableInsertSchema.safeParse(input);
				expect(result.success).toBe(false);
			});

			it("should reject missing type", () => {
				const { type, ...input } = validInput;
				const result = advertisementsTableInsertSchema.safeParse(input);
				expect(result.success).toBe(false);
			});

			it("should reject missing startAt", () => {
				const { startAt, ...input } = validInput;
				const result = advertisementsTableInsertSchema.safeParse(input);
				expect(result.success).toBe(false);
			});

			it("should reject missing endAt", () => {
				const { endAt, ...input } = validInput;
				const result = advertisementsTableInsertSchema.safeParse(input);
				expect(result.success).toBe(false);
			});

			it("should reject missing organizationId", () => {
				const { organizationId, ...input } = validInput;
				const result = advertisementsTableInsertSchema.safeParse(input);
				expect(result.success).toBe(false);
			});

			it("should reject empty object", () => {
				const result = advertisementsTableInsertSchema.safeParse({});
				expect(result.success).toBe(false);
			});
		});

		describe("UUID validation", () => {
			it("should reject invalid organizationId UUID", () => {
				const result = advertisementsTableInsertSchema.safeParse({
					...validInput,
					organizationId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject invalid creatorId UUID", () => {
				const result = advertisementsTableInsertSchema.safeParse({
					...validInput,
					creatorId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject invalid updaterId UUID", () => {
				const result = advertisementsTableInsertSchema.safeParse({
					...validInput,
					updaterId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should accept valid UUIDs for all UUID fields", () => {
				const result = advertisementsTableInsertSchema.safeParse({
					...validInput,
					creatorId: faker.string.uuid(),
					updaterId: faker.string.uuid(),
				});
				expect(result.success).toBe(true);
			});
		});

		describe("name field validation", () => {
			it("should accept name with minimum length (1 character)", () => {
				const result = advertisementsTableInsertSchema.safeParse({
					...validInput,
					name: "a",
				});
				expect(result.success).toBe(true);
			});

			it("should accept name with maximum length (256 characters)", () => {
				const result = advertisementsTableInsertSchema.safeParse({
					...validInput,
					name: "a".repeat(256),
				});
				expect(result.success).toBe(true);
			});

			it("should reject empty name", () => {
				const result = advertisementsTableInsertSchema.safeParse({
					...validInput,
					name: "",
				});
				expect(result.success).toBe(false);
			});

			it("should reject name exceeding maximum length", () => {
				const result = advertisementsTableInsertSchema.safeParse({
					...validInput,
					name: "a".repeat(257),
				});
				expect(result.success).toBe(false);
			});
		});

		describe("description field validation", () => {
			it("should accept description with minimum length (1 character)", () => {
				const result = advertisementsTableInsertSchema.safeParse({
					...validInput,
					description: "a",
				});
				expect(result.success).toBe(true);
			});

			it("should accept description with maximum length (2048 characters)", () => {
				const result = advertisementsTableInsertSchema.safeParse({
					...validInput,
					description: "a".repeat(2048),
				});
				expect(result.success).toBe(true);
			});

			it("should reject empty description", () => {
				const result = advertisementsTableInsertSchema.safeParse({
					...validInput,
					description: "",
				});
				expect(result.success).toBe(false);
			});

			it("should reject description exceeding maximum length", () => {
				const result = advertisementsTableInsertSchema.safeParse({
					...validInput,
					description: "a".repeat(2049),
				});
				expect(result.success).toBe(false);
			});

			it("should accept undefined description", () => {
				const result = advertisementsTableInsertSchema.safeParse({
					...validInput,
					description: undefined,
				});
				expect(result.success).toBe(true);
			});
		});

		describe("type field (enum) validation", () => {
			it("should accept 'banner' type", () => {
				const result = advertisementsTableInsertSchema.safeParse({
					...validInput,
					type: "banner",
				});
				expect(result.success).toBe(true);
			});

			it("should accept 'menu' type", () => {
				const result = advertisementsTableInsertSchema.safeParse({
					...validInput,
					type: "menu",
				});
				expect(result.success).toBe(true);
			});

			it("should accept 'pop_up' type", () => {
				const result = advertisementsTableInsertSchema.safeParse({
					...validInput,
					type: "pop_up",
				});
				expect(result.success).toBe(true);
			});

			it("should reject invalid type", () => {
				const result = advertisementsTableInsertSchema.safeParse({
					...validInput,
					type: "invalid_type",
				});
				expect(result.success).toBe(false);
			});

			it("should reject empty type", () => {
				const result = advertisementsTableInsertSchema.safeParse({
					...validInput,
					type: "",
				});
				expect(result.success).toBe(false);
			});
		});

		describe("timestamp fields validation", () => {
			it("should accept valid Date objects for startAt and endAt", () => {
				const result = advertisementsTableInsertSchema.safeParse({
					...validInput,
					startAt: new Date(),
					endAt: new Date(Date.now() + 86400000), // tomorrow
				});
				expect(result.success).toBe(true);
			});

			it("should accept date strings that can be parsed", () => {
				const result = advertisementsTableInsertSchema.safeParse({
					...validInput,
					startAt: new Date("2024-01-01T00:00:00Z"),
					endAt: new Date("2024-12-31T23:59:59Z"),
				});
				expect(result.success).toBe(true);
			});
		});

		describe("optional fields validation", () => {
			it("should accept input with creatorId", () => {
				const result = advertisementsTableInsertSchema.safeParse({
					...validInput,
					creatorId: faker.string.uuid(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept input with updaterId", () => {
				const result = advertisementsTableInsertSchema.safeParse({
					...validInput,
					updaterId: faker.string.uuid(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept input with description", () => {
				const result = advertisementsTableInsertSchema.safeParse({
					...validInput,
					description: faker.lorem.paragraph(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept input with all optional fields", () => {
				const result = advertisementsTableInsertSchema.safeParse({
					...validInput,
					description: faker.lorem.paragraph(),
					creatorId: faker.string.uuid(),
					updaterId: faker.string.uuid(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined for optional fields", () => {
				const result = advertisementsTableInsertSchema.safeParse({
					...validInput,
					description: undefined,
					creatorId: undefined,
					updaterId: undefined,
				});
				expect(result.success).toBe(true);
			});
		});

		describe("edge cases", () => {
			it("should reject null values for required fields", () => {
				const result = advertisementsTableInsertSchema.safeParse({
					...validInput,
					name: null,
				});
				expect(result.success).toBe(false);
			});

			it("should accept complete valid advertisement record", () => {
				const result = advertisementsTableInsertSchema.safeParse({
					name: faker.lorem.words(3),
					type: "pop_up",
					startAt: new Date(),
					endAt: new Date(Date.now() + 86400000 * 7), // 7 days from now
					organizationId: faker.string.uuid(),
					description: faker.lorem.paragraph(),
					creatorId: faker.string.uuid(),
					updaterId: faker.string.uuid(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept banner advertisement without description", () => {
				const result = advertisementsTableInsertSchema.safeParse({
					name: faker.lorem.words(2),
					type: "banner",
					startAt: new Date(),
					endAt: new Date(Date.now() + 86400000),
					organizationId: faker.string.uuid(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept menu advertisement with all fields", () => {
				const result = advertisementsTableInsertSchema.safeParse({
					name: faker.lorem.words(2),
					type: "menu",
					startAt: new Date(),
					endAt: new Date(Date.now() + 86400000),
					organizationId: faker.string.uuid(),
					description: faker.lorem.sentence(),
					creatorId: faker.string.uuid(),
				});
				expect(result.success).toBe(true);
			});

			it("should handle multiple validation errors", () => {
				const result = advertisementsTableInsertSchema.safeParse({
					name: "",
					type: "invalid",
					organizationId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
				if (!result.success) {
					expect(result.error.issues.length).toBeGreaterThan(1);
				}
			});
		});
	});
});
