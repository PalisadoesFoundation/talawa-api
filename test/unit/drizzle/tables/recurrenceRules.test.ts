import { faker } from "@faker-js/faker";
import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";
import { eventsTable } from "~/src/drizzle/tables/events";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import {
	recurrenceFrequencyEnum,
	recurrenceRulesTable,
	recurrenceRulesTableInsertSchema,
	recurrenceRulesTableRelations,
} from "~/src/drizzle/tables/recurrenceRules";
import { usersTable } from "~/src/drizzle/tables/users";

describe("src/drizzle/tables/recurrenceRules.ts", () => {
	describe("recurrenceFrequencyEnum", () => {
		it.each([
			["DAILY"],
			["WEEKLY"],
			["MONTHLY"],
			["YEARLY"],
		])("should accept valid frequency %s", (frequency) => {
			expect(recurrenceFrequencyEnum.enumValues).toContain(frequency);
		});

		it("should have exactly 4 frequency values", () => {
			expect(recurrenceFrequencyEnum.enumValues).toHaveLength(4);
		});

		it("should have correct enum name", () => {
			expect(recurrenceFrequencyEnum.enumName).toBe("frequency");
		});
	});

	describe("recurrenceRulesTable schema", () => {
		it("should be defined as a pgTable", () => {
			expect(recurrenceRulesTable).toBeDefined();
			// Verify it's a drizzle table by checking for table-specific properties
			expect(recurrenceRulesTable.id).toBeDefined();
		});

		it("should have all required columns defined", () => {
			const columns = Object.keys(recurrenceRulesTable);
			expect(columns).toContain("id");
			expect(columns).toContain("recurrenceRuleString");
			expect(columns).toContain("frequency");
			expect(columns).toContain("interval");
			expect(columns).toContain("recurrenceStartDate");
			expect(columns).toContain("recurrenceEndDate");
			expect(columns).toContain("count");
			expect(columns).toContain("latestInstanceDate");
			expect(columns).toContain("byDay");
			expect(columns).toContain("byMonth");
			expect(columns).toContain("byMonthDay");
			expect(columns).toContain("baseRecurringEventId");
			expect(columns).toContain("originalSeriesId");
			expect(columns).toContain("organizationId");
			expect(columns).toContain("creatorId");
			expect(columns).toContain("updaterId");
			expect(columns).toContain("createdAt");
			expect(columns).toContain("updatedAt");
		});

		it("should have id as primary key", () => {
			expect(recurrenceRulesTable.id.primary).toBe(true);
		});

		it("should have correct column configurations", () => {
			// Verify columns exist and have expected properties
			expect(recurrenceRulesTable.id).toBeDefined();
			expect(recurrenceRulesTable.recurrenceRuleString).toBeDefined();
			expect(recurrenceRulesTable.interval).toBeDefined();
			expect(recurrenceRulesTable.recurrenceStartDate).toBeDefined();
			expect(recurrenceRulesTable.recurrenceEndDate).toBeDefined();
			expect(recurrenceRulesTable.count).toBeDefined();
			expect(recurrenceRulesTable.latestInstanceDate).toBeDefined();
			expect(recurrenceRulesTable.byDay).toBeDefined();
			expect(recurrenceRulesTable.byMonth).toBeDefined();
			expect(recurrenceRulesTable.byMonthDay).toBeDefined();
			expect(recurrenceRulesTable.baseRecurringEventId).toBeDefined();
			expect(recurrenceRulesTable.originalSeriesId).toBeDefined();
			expect(recurrenceRulesTable.organizationId).toBeDefined();
			expect(recurrenceRulesTable.creatorId).toBeDefined();
			expect(recurrenceRulesTable.updaterId).toBeDefined();
			expect(recurrenceRulesTable.createdAt).toBeDefined();
			expect(recurrenceRulesTable.updatedAt).toBeDefined();
		});

		it("should have correct not null constraints", () => {
			expect(recurrenceRulesTable.id.notNull).toBe(true);
			expect(recurrenceRulesTable.recurrenceRuleString.notNull).toBe(true);
			expect(recurrenceRulesTable.frequency.notNull).toBe(true);
			expect(recurrenceRulesTable.interval.notNull).toBe(true);
			expect(recurrenceRulesTable.recurrenceStartDate.notNull).toBe(true);
			expect(recurrenceRulesTable.latestInstanceDate.notNull).toBe(true);
			expect(recurrenceRulesTable.baseRecurringEventId.notNull).toBe(true);
			expect(recurrenceRulesTable.organizationId.notNull).toBe(true);
			expect(recurrenceRulesTable.creatorId.notNull).toBe(true);
			expect(recurrenceRulesTable.createdAt.notNull).toBe(true);
			// Optional fields
			expect(recurrenceRulesTable.recurrenceEndDate.notNull).toBe(false);
			expect(recurrenceRulesTable.count.notNull).toBe(false);
			expect(recurrenceRulesTable.byDay.notNull).toBe(false);
			expect(recurrenceRulesTable.byMonth.notNull).toBe(false);
			expect(recurrenceRulesTable.byMonthDay.notNull).toBe(false);
			expect(recurrenceRulesTable.originalSeriesId.notNull).toBe(false);
			expect(recurrenceRulesTable.updaterId.notNull).toBe(false);
			expect(recurrenceRulesTable.updatedAt.notNull).toBe(false);
		});

		it("should have default value for interval", () => {
			expect(recurrenceRulesTable.interval.hasDefault).toBe(true);
		});

		it("should have default value for createdAt", () => {
			expect(recurrenceRulesTable.createdAt.hasDefault).toBe(true);
		});

		it("should have four foreign keys defined", () => {
			const { foreignKeys } = getTableConfig(recurrenceRulesTable);
			expect(foreignKeys).toBeDefined();
			expect(foreignKeys.length).toBe(4);
		});

		it("should have baseRecurringEventId referencing eventsTable.id", () => {
			const tableConfig = getTableConfig(recurrenceRulesTable);
			const baseEventFk = tableConfig.foreignKeys.find((fk) => {
				const ref = fk.reference();
				return ref.columns.some(
					(col) => col.name === "base_recurring_event_id",
				);
			});
			expect(baseEventFk).toBeDefined();
			expect(baseEventFk?.onDelete).toBe("cascade");
			expect(baseEventFk?.onUpdate).toBe("cascade");
			// Execute the reference function to cover the callback
			const ref = baseEventFk?.reference();
			expect(ref?.foreignTable).toBe(eventsTable);
			expect(ref?.foreignColumns[0]?.name).toBe("id");
		});

		it("should have organizationId referencing organizationsTable.id", () => {
			const tableConfig = getTableConfig(recurrenceRulesTable);
			const orgFk = tableConfig.foreignKeys.find((fk) => {
				const ref = fk.reference();
				return ref.columns.some((col) => col.name === "organization_id");
			});
			expect(orgFk).toBeDefined();
			expect(orgFk?.onDelete).toBe("cascade");
			expect(orgFk?.onUpdate).toBe("cascade");
			// Execute the reference function to cover the callback
			const ref = orgFk?.reference();
			expect(ref?.foreignTable).toBe(organizationsTable);
			expect(ref?.foreignColumns[0]?.name).toBe("id");
		});

		it("should have creatorId referencing usersTable.id", () => {
			const tableConfig = getTableConfig(recurrenceRulesTable);
			const creatorFk = tableConfig.foreignKeys.find((fk) => {
				const ref = fk.reference();
				return ref.columns.some((col) => col.name === "creator_id");
			});
			expect(creatorFk).toBeDefined();
			expect(creatorFk?.onDelete).toBe("set null");
			expect(creatorFk?.onUpdate).toBe("cascade");
			// Execute the reference function to cover the callback
			const ref = creatorFk?.reference();
			expect(ref?.foreignTable).toBe(usersTable);
			expect(ref?.foreignColumns[0]?.name).toBe("id");
		});

		it("should have updaterId referencing usersTable.id", () => {
			const tableConfig = getTableConfig(recurrenceRulesTable);
			const updaterFk = tableConfig.foreignKeys.find((fk) => {
				const ref = fk.reference();
				return ref.columns.some((col) => col.name === "updater_id");
			});
			expect(updaterFk).toBeDefined();
			expect(updaterFk?.onDelete).toBe("set null");
			expect(updaterFk?.onUpdate).toBe("cascade");
			// Execute the reference function to cover the callback
			const ref = updaterFk?.reference();
			expect(ref?.foreignTable).toBe(usersTable);
			expect(ref?.foreignColumns[0]?.name).toBe("id");
		});

		it("should have all required indexes defined", () => {
			const tableConfig = getTableConfig(recurrenceRulesTable);

			// Verify indexes are defined
			expect(tableConfig.indexes).toBeDefined();
			expect(tableConfig.indexes.length).toBeGreaterThan(0);

			// Get index names
			const indexNames = tableConfig.indexes.map((idx) => idx.config.name);

			// Verify all expected indexes exist
			expect(indexNames).toContain("rr_latest_instance_date_idx");
			expect(indexNames).toContain("rr_organization_id_idx");
			expect(indexNames).toContain("rr_base_recurring_event_id_idx");
			expect(indexNames).toContain("rr_frequency_idx");
			expect(indexNames).toContain("rr_creator_id_idx");
			expect(indexNames).toContain("rr_recurrence_start_date_idx");
			expect(indexNames).toContain("rr_recurrence_end_date_idx");
		});

		it("should have correct table name in config", () => {
			const tableConfig = getTableConfig(recurrenceRulesTable);
			expect(tableConfig.name).toBe("recurrence_rules");
		});
	});

	describe("recurrenceRulesTableRelations", () => {
		it("should be defined", () => {
			expect(recurrenceRulesTableRelations).toBeDefined();
		});

		it("should have correct relation configuration", () => {
			const config = recurrenceRulesTableRelations.config;
			expect(config).toBeDefined();
			expect(typeof config).toBe("function");
		});

		it("should reference the correct table", () => {
			expect(recurrenceRulesTableRelations.table).toBe(recurrenceRulesTable);
		});

		it("should define all four relations", () => {
			// Access the internal relations data structure
			// The relations are defined when the module loads
			const relationConfig = recurrenceRulesTableRelations.config;
			expect(relationConfig).toBeDefined();

			// Create a mock that returns chainable objects like Drizzle expects
			const createMockRelation = () => ({
				withFieldName: vi.fn().mockReturnThis(),
			});

			const mockOne = vi.fn().mockImplementation(() => createMockRelation());
			const mockMany = vi.fn().mockImplementation(() => createMockRelation());

			// Invoke the config to exercise the relation definitions
			const result = relationConfig({ one: mockOne, many: mockMany });

			// Verify all four relations are defined
			expect(result).toHaveProperty("baseRecurringEvent");
			expect(result).toHaveProperty("organization");
			expect(result).toHaveProperty("creator");
			expect(result).toHaveProperty("updater");

			// Verify one() was called 4 times (once for each relation)
			expect(mockOne).toHaveBeenCalledTimes(4);
		});
	});

	describe("recurrenceRulesTableInsertSchema", () => {
		const validInput = {
			recurrenceRuleString: "RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR",
			frequency: "WEEKLY" as const,
			interval: 1,
			recurrenceStartDate: new Date(),
			latestInstanceDate: new Date(),
			baseRecurringEventId: faker.string.uuid(),
			organizationId: faker.string.uuid(),
			creatorId: faker.string.uuid(),
		};

		describe("recurrenceRuleString validation", () => {
			it("should accept valid recurrence rule string", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse(validInput);
				expect(result.success).toBe(true);
			});

			it("should reject empty recurrence rule string", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					recurrenceRuleString: "",
				});
				expect(result.success).toBe(false);
			});

			it("should reject recurrence rule string exceeding 512 characters", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					recurrenceRuleString: "a".repeat(513),
				});
				expect(result.success).toBe(false);
			});

			it("should accept recurrence rule string at max length (512)", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					recurrenceRuleString: "a".repeat(512),
				});
				expect(result.success).toBe(true);
			});

			it("should accept recurrence rule string at min length (1)", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					recurrenceRuleString: "a",
				});
				expect(result.success).toBe(true);
			});
		});

		describe("frequency validation", () => {
			it.each([
				["DAILY"],
				["WEEKLY"],
				["MONTHLY"],
				["YEARLY"],
			])("should accept valid frequency %s", (frequency) => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					frequency,
				});
				expect(result.success).toBe(true);
			});

			it("should reject invalid frequency", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					frequency: "INVALID",
				});
				expect(result.success).toBe(false);
			});

			it("should reject lowercase frequency", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					frequency: "daily",
				});
				expect(result.success).toBe(false);
			});

			it("should reject empty frequency", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					frequency: "",
				});
				expect(result.success).toBe(false);
			});
		});

		describe("interval validation", () => {
			it("should accept valid interval", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					interval: 2,
				});
				expect(result.success).toBe(true);
			});

			it("should accept minimum interval (1)", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					interval: 1,
				});
				expect(result.success).toBe(true);
			});

			it("should accept maximum interval (999)", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					interval: 999,
				});
				expect(result.success).toBe(true);
			});

			it("should reject interval less than 1", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					interval: 0,
				});
				expect(result.success).toBe(false);
			});

			it("should reject negative interval", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					interval: -1,
				});
				expect(result.success).toBe(false);
			});

			it("should reject interval greater than 999", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					interval: 1000,
				});
				expect(result.success).toBe(false);
			});
		});

		describe("byDay validation", () => {
			it("should accept valid byDay array", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					byDay: ["MO", "WE", "FR"],
				});
				expect(result.success).toBe(true);
			});

			it("should accept byDay with ordinal prefix", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					byDay: ["1MO", "2TU", "3WE"],
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined byDay", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					byDay: undefined,
				});
				expect(result.success).toBe(true);
			});

			it("should accept empty byDay array", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					byDay: [],
				});
				expect(result.success).toBe(true);
			});

			it("should reject byDay with string shorter than 2 characters", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					byDay: ["M"],
				});
				expect(result.success).toBe(false);
			});

			it("should reject byDay with string longer than 3 characters", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					byDay: ["MONDAY"],
				});
				expect(result.success).toBe(false);
			});
		});

		describe("byMonth validation", () => {
			it("should accept valid byMonth array", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					byMonth: [1, 6, 12],
				});
				expect(result.success).toBe(true);
			});

			it("should accept minimum month value (1)", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					byMonth: [1],
				});
				expect(result.success).toBe(true);
			});

			it("should accept maximum month value (12)", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					byMonth: [12],
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined byMonth", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					byMonth: undefined,
				});
				expect(result.success).toBe(true);
			});

			it("should reject month value less than 1", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					byMonth: [0],
				});
				expect(result.success).toBe(false);
			});

			it("should reject month value greater than 12", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					byMonth: [13],
				});
				expect(result.success).toBe(false);
			});

			it("should reject negative month value", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					byMonth: [-1],
				});
				expect(result.success).toBe(false);
			});
		});

		describe("byMonthDay validation", () => {
			it("should accept valid byMonthDay array", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					byMonthDay: [1, 15, 28],
				});
				expect(result.success).toBe(true);
			});

			it("should accept negative byMonthDay for last days of month", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					byMonthDay: [-1, -15, -31],
				});
				expect(result.success).toBe(true);
			});

			it("should accept minimum byMonthDay value (-31)", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					byMonthDay: [-31],
				});
				expect(result.success).toBe(true);
			});

			it("should accept maximum byMonthDay value (31)", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					byMonthDay: [31],
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined byMonthDay", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					byMonthDay: undefined,
				});
				expect(result.success).toBe(true);
			});

			it("should reject byMonthDay value less than -31", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					byMonthDay: [-32],
				});
				expect(result.success).toBe(false);
			});

			it("should reject byMonthDay value greater than 31", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					byMonthDay: [32],
				});
				expect(result.success).toBe(false);
			});
		});

		describe("required fields validation", () => {
			it("should reject missing recurrenceRuleString", () => {
				const { recurrenceRuleString, ...input } = validInput;
				const result = recurrenceRulesTableInsertSchema.safeParse(input);
				expect(result.success).toBe(false);
			});

			it("should reject missing frequency", () => {
				const { frequency, ...input } = validInput;
				const result = recurrenceRulesTableInsertSchema.safeParse(input);
				expect(result.success).toBe(false);
			});

			it("should reject missing recurrenceStartDate", () => {
				const { recurrenceStartDate, ...input } = validInput;
				const result = recurrenceRulesTableInsertSchema.safeParse(input);
				expect(result.success).toBe(false);
			});

			it("should reject missing latestInstanceDate", () => {
				const { latestInstanceDate, ...input } = validInput;
				const result = recurrenceRulesTableInsertSchema.safeParse(input);
				expect(result.success).toBe(false);
			});

			it("should reject missing baseRecurringEventId", () => {
				const { baseRecurringEventId, ...input } = validInput;
				const result = recurrenceRulesTableInsertSchema.safeParse(input);
				expect(result.success).toBe(false);
			});

			it("should reject missing organizationId", () => {
				const { organizationId, ...input } = validInput;
				const result = recurrenceRulesTableInsertSchema.safeParse(input);
				expect(result.success).toBe(false);
			});

			it("should reject missing creatorId", () => {
				const { creatorId, ...input } = validInput;
				const result = recurrenceRulesTableInsertSchema.safeParse(input);
				expect(result.success).toBe(false);
			});
		});

		describe("optional fields validation", () => {
			it("should accept input with recurrenceEndDate", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					recurrenceEndDate: new Date(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept input with count", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					count: 10,
				});
				expect(result.success).toBe(true);
			});

			it("should accept input with originalSeriesId", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					originalSeriesId: faker.string.uuid(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept input with updaterId", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					updaterId: faker.string.uuid(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept input without optional fields", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse(validInput);
				expect(result.success).toBe(true);
			});
		});

		describe("UUID validation", () => {
			it("should reject invalid baseRecurringEventId UUID", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					baseRecurringEventId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject invalid organizationId UUID", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					organizationId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject invalid creatorId UUID", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					creatorId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject invalid updaterId UUID", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					updaterId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject invalid originalSeriesId UUID", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					originalSeriesId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});
		});

		describe("date validation", () => {
			it("should accept valid Date objects", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					recurrenceStartDate: new Date("2025-01-01"),
					latestInstanceDate: new Date("2025-01-01"),
					recurrenceEndDate: new Date("2025-12-31"),
				});
				expect(result.success).toBe(true);
			});

			it("should require Date objects for date fields", () => {
				// The schema expects Date objects, not strings
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					recurrenceStartDate: new Date("2025-01-01T00:00:00Z"),
					latestInstanceDate: new Date("2025-01-01T00:00:00Z"),
				});
				expect(result.success).toBe(true);
			});

			it("should reject string dates", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					recurrenceStartDate: "2025-01-01" as unknown as Date,
					latestInstanceDate: "2025-01-01" as unknown as Date,
				});
				expect(result.success).toBe(false);
			});
		});

		describe("edge cases", () => {
			it("should accept all valid frequency types with full configuration", () => {
				const frequencies = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;
				for (const frequency of frequencies) {
					const result = recurrenceRulesTableInsertSchema.safeParse({
						...validInput,
						frequency,
						byDay: ["MO", "TU"],
						byMonth: [1, 6],
						byMonthDay: [1, 15],
					});
					expect(result.success).toBe(true);
				}
			});

			it("should reject null values for required fields", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({
					...validInput,
					recurrenceRuleString: null,
				});
				expect(result.success).toBe(false);
			});

			it("should reject empty object", () => {
				const result = recurrenceRulesTableInsertSchema.safeParse({});
				expect(result.success).toBe(false);
			});
		});
	});
});
