import { getTableName, type Table } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { beforeAll, describe, expect, it } from "vitest";
import {
	fundCampaignPledgesTable,
	fundCampaignPledgesTableInsertSchema,
	fundCampaignPledgesTableRelations,
} from "~/src/drizzle/tables/fundCampaignPledges";

/**
 * Maximum length for the note field in fund campaign pledges.
 * This value is defined in the insert schema validation.
 */
const NOTE_MAX_LENGTH = 2048;

describe("fundCampaignPledgesTable", () => {
	describe("fundCampaignPledgesTableInsertSchema", () => {
		const validPledgeData = {
			amount: 100,
			campaignId: "01234567-89ab-cdef-0123-456789abcdef",
			pledgerId: "11111111-1111-1111-1111-111111111111",
		};

		describe("amount field", () => {
			it("should accept a valid amount", () => {
				const result =
					fundCampaignPledgesTableInsertSchema.safeParse(validPledgeData);
				expect(result.success).toBe(true);
			});

			it("should accept minimum amount (1)", () => {
				const result = fundCampaignPledgesTableInsertSchema.safeParse({
					...validPledgeData,
					amount: 1,
				});
				expect(result.success).toBe(true);
			});

			it("should accept large amount values", () => {
				const result = fundCampaignPledgesTableInsertSchema.safeParse({
					...validPledgeData,
					amount: 1000000,
				});
				expect(result.success).toBe(true);
			});

			it("should reject amount of 0", () => {
				const result = fundCampaignPledgesTableInsertSchema.safeParse({
					...validPledgeData,
					amount: 0,
				});
				expect(result.success).toBe(false);
			});

			it("should reject negative amount", () => {
				const result = fundCampaignPledgesTableInsertSchema.safeParse({
					...validPledgeData,
					amount: -100,
				});
				expect(result.success).toBe(false);
			});

			it("should reject missing amount", () => {
				const { amount: _amount, ...dataWithoutAmount } = validPledgeData;
				const result =
					fundCampaignPledgesTableInsertSchema.safeParse(dataWithoutAmount);
				expect(result.success).toBe(false);
			});

			it("should reject null amount", () => {
				const result = fundCampaignPledgesTableInsertSchema.safeParse({
					...validPledgeData,
					amount: null,
				});
				expect(result.success).toBe(false);
			});

			it("should reject undefined amount", () => {
				const result = fundCampaignPledgesTableInsertSchema.safeParse({
					...validPledgeData,
					amount: undefined,
				});
				expect(result.success).toBe(false);
			});

			it("should reject string amount", () => {
				const result = fundCampaignPledgesTableInsertSchema.safeParse({
					...validPledgeData,
					amount: "100",
				});
				expect(result.success).toBe(false);
			});
		});

		describe("note field", () => {
			it("should accept a valid note", () => {
				const result = fundCampaignPledgesTableInsertSchema.safeParse({
					...validPledgeData,
					note: "This is a pledge note.",
				});
				expect(result.success).toBe(true);
			});

			it("should accept note with minimum length (1 character)", () => {
				const result = fundCampaignPledgesTableInsertSchema.safeParse({
					...validPledgeData,
					note: "A",
				});
				expect(result.success).toBe(true);
			});

			it("should accept note with maximum length (2048 characters)", () => {
				const result = fundCampaignPledgesTableInsertSchema.safeParse({
					...validPledgeData,
					note: "A".repeat(NOTE_MAX_LENGTH),
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined note (optional field)", () => {
				const result =
					fundCampaignPledgesTableInsertSchema.safeParse(validPledgeData);
				expect(result.success).toBe(true);
			});

			it("should reject an empty note", () => {
				const result = fundCampaignPledgesTableInsertSchema.safeParse({
					...validPledgeData,
					note: "",
				});
				expect(result.success).toBe(false);
			});

			it("should reject note exceeding maximum length", () => {
				const result = fundCampaignPledgesTableInsertSchema.safeParse({
					...validPledgeData,
					note: "A".repeat(NOTE_MAX_LENGTH + 1),
				});
				expect(result.success).toBe(false);
			});
		});

		describe("campaignId field", () => {
			it("should accept a valid UUID", () => {
				const result =
					fundCampaignPledgesTableInsertSchema.safeParse(validPledgeData);
				expect(result.success).toBe(true);
			});

			it("should reject missing campaignId", () => {
				const { campaignId: _campaignId, ...dataWithoutCampaignId } =
					validPledgeData;
				const result = fundCampaignPledgesTableInsertSchema.safeParse(
					dataWithoutCampaignId,
				);
				expect(result.success).toBe(false);
			});

			it("should reject invalid UUID format", () => {
				const result = fundCampaignPledgesTableInsertSchema.safeParse({
					...validPledgeData,
					campaignId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject null campaignId", () => {
				const result = fundCampaignPledgesTableInsertSchema.safeParse({
					...validPledgeData,
					campaignId: null,
				});
				expect(result.success).toBe(false);
			});
		});

		describe("pledgerId field", () => {
			it("should accept a valid UUID", () => {
				const result =
					fundCampaignPledgesTableInsertSchema.safeParse(validPledgeData);
				expect(result.success).toBe(true);
			});

			it("should reject missing pledgerId", () => {
				const { pledgerId: _pledgerId, ...dataWithoutPledgerId } =
					validPledgeData;
				const result =
					fundCampaignPledgesTableInsertSchema.safeParse(dataWithoutPledgerId);
				expect(result.success).toBe(false);
			});

			it("should reject invalid UUID format", () => {
				const result = fundCampaignPledgesTableInsertSchema.safeParse({
					...validPledgeData,
					pledgerId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject null pledgerId", () => {
				const result = fundCampaignPledgesTableInsertSchema.safeParse({
					...validPledgeData,
					pledgerId: null,
				});
				expect(result.success).toBe(false);
			});
		});

		describe("id field", () => {
			it("should accept a valid UUID for id", () => {
				const result = fundCampaignPledgesTableInsertSchema.safeParse({
					...validPledgeData,
					id: "01234567-89ab-cdef-0123-456789abcdef",
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined id (auto-generated)", () => {
				const result =
					fundCampaignPledgesTableInsertSchema.safeParse(validPledgeData);
				expect(result.success).toBe(true);
			});

			it("should reject invalid UUID format for id", () => {
				const result = fundCampaignPledgesTableInsertSchema.safeParse({
					...validPledgeData,
					id: "not-a-valid-uuid",
				});
				expect(result.success).toBe(false);
			});
		});

		describe("creatorId field", () => {
			it("should accept a valid UUID for creatorId", () => {
				const result = fundCampaignPledgesTableInsertSchema.safeParse({
					...validPledgeData,
					creatorId: "01234567-89ab-cdef-0123-456789abcdef",
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined creatorId (optional field)", () => {
				const result =
					fundCampaignPledgesTableInsertSchema.safeParse(validPledgeData);
				expect(result.success).toBe(true);
			});

			it("should accept null creatorId (nullable field)", () => {
				const result = fundCampaignPledgesTableInsertSchema.safeParse({
					...validPledgeData,
					creatorId: null,
				});
				expect(result.success).toBe(true);
			});

			it("should reject invalid UUID format for creatorId", () => {
				const result = fundCampaignPledgesTableInsertSchema.safeParse({
					...validPledgeData,
					creatorId: "invalid",
				});
				expect(result.success).toBe(false);
			});
		});

		describe("updaterId field", () => {
			it("should accept a valid UUID for updaterId", () => {
				const result = fundCampaignPledgesTableInsertSchema.safeParse({
					...validPledgeData,
					updaterId: "01234567-89ab-cdef-0123-456789abcdef",
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined updaterId (optional field)", () => {
				const result =
					fundCampaignPledgesTableInsertSchema.safeParse(validPledgeData);
				expect(result.success).toBe(true);
			});

			it("should accept null updaterId (nullable field)", () => {
				const result = fundCampaignPledgesTableInsertSchema.safeParse({
					...validPledgeData,
					updaterId: null,
				});
				expect(result.success).toBe(true);
			});

			it("should reject invalid UUID format for updaterId", () => {
				const result = fundCampaignPledgesTableInsertSchema.safeParse({
					...validPledgeData,
					updaterId: "invalid",
				});
				expect(result.success).toBe(false);
			});
		});

		describe("complete pledge data", () => {
			it("should accept complete valid pledge data", () => {
				const completePledgeData = {
					amount: 500,
					campaignId: "01234567-89ab-cdef-0123-456789abcdef",
					pledgerId: "11111111-1111-1111-1111-111111111111",
					note: "This is my pledge for the campaign.",
					creatorId: "22222222-2222-2222-2222-222222222222",
					updaterId: "33333333-3333-3333-3333-333333333333",
				};
				const result =
					fundCampaignPledgesTableInsertSchema.safeParse(completePledgeData);
				expect(result.success).toBe(true);
			});

			it("should accept minimal valid pledge data", () => {
				const minimalPledgeData = {
					amount: 1,
					campaignId: "01234567-89ab-cdef-0123-456789abcdef",
					pledgerId: "11111111-1111-1111-1111-111111111111",
				};
				const result =
					fundCampaignPledgesTableInsertSchema.safeParse(minimalPledgeData);
				expect(result.success).toBe(true);
			});

			it("should reject empty object", () => {
				const result = fundCampaignPledgesTableInsertSchema.safeParse({});
				expect(result.success).toBe(false);
			});

			it("should reject null", () => {
				const result = fundCampaignPledgesTableInsertSchema.safeParse(null);
				expect(result.success).toBe(false);
			});

			it("should reject undefined", () => {
				const result =
					fundCampaignPledgesTableInsertSchema.safeParse(undefined);
				expect(result.success).toBe(false);
			});
		});
	});

	describe("fundCampaignPledgesTable structure", () => {
		it("should have amount column", () => {
			expect(fundCampaignPledgesTable.amount).toBeDefined();
			expect(fundCampaignPledgesTable.amount.name).toBe("amount");
		});

		it("should have campaignId column", () => {
			expect(fundCampaignPledgesTable.campaignId).toBeDefined();
			expect(fundCampaignPledgesTable.campaignId.name).toBe("campaign_id");
		});

		it("should have createdAt column", () => {
			expect(fundCampaignPledgesTable.createdAt).toBeDefined();
			expect(fundCampaignPledgesTable.createdAt.name).toBe("created_at");
		});

		it("should have creatorId column", () => {
			expect(fundCampaignPledgesTable.creatorId).toBeDefined();
			expect(fundCampaignPledgesTable.creatorId.name).toBe("creator_id");
		});

		it("should have id column as primary key", () => {
			expect(fundCampaignPledgesTable.id).toBeDefined();
			expect(fundCampaignPledgesTable.id.name).toBe("id");
		});

		it("should have note column", () => {
			expect(fundCampaignPledgesTable.note).toBeDefined();
			expect(fundCampaignPledgesTable.note.name).toBe("note");
		});

		it("should have pledgerId column", () => {
			expect(fundCampaignPledgesTable.pledgerId).toBeDefined();
			expect(fundCampaignPledgesTable.pledgerId.name).toBe("pledger_id");
		});

		it("should have updatedAt column", () => {
			expect(fundCampaignPledgesTable.updatedAt).toBeDefined();
			expect(fundCampaignPledgesTable.updatedAt.name).toBe("updated_at");
		});

		it("should have updaterId column", () => {
			expect(fundCampaignPledgesTable.updaterId).toBeDefined();
			expect(fundCampaignPledgesTable.updaterId.name).toBe("updater_id");
		});
	});

	describe("fundCampaignPledgesTable indexes", () => {
		const tableConfig = getTableConfig(fundCampaignPledgesTable);

		// Helper function to get column name from indexed column
		const getColumnName = (
			col: (typeof tableConfig.indexes)[0]["config"]["columns"][0] | undefined,
		): string | undefined => {
			if (col && "name" in col) {
				return col.name as string;
			}
			return undefined;
		};

		it("should have an index on campaignId column", () => {
			const campaignIdIndex = tableConfig.indexes.find(
				(idx) =>
					idx.config.columns.length === 1 &&
					getColumnName(idx.config.columns[0]) === "campaign_id",
			);
			expect(campaignIdIndex).toBeDefined();
			expect(campaignIdIndex?.config.unique).toBe(false);
		});

		it("should have an index on createdAt column", () => {
			const createdAtIndex = tableConfig.indexes.find(
				(idx) =>
					idx.config.columns.length === 1 &&
					getColumnName(idx.config.columns[0]) === "created_at",
			);
			expect(createdAtIndex).toBeDefined();
			expect(createdAtIndex?.config.unique).toBe(false);
		});

		it("should have an index on creatorId column", () => {
			const creatorIdIndex = tableConfig.indexes.find(
				(idx) =>
					idx.config.columns.length === 1 &&
					getColumnName(idx.config.columns[0]) === "creator_id",
			);
			expect(creatorIdIndex).toBeDefined();
			expect(creatorIdIndex?.config.unique).toBe(false);
		});

		it("should have an index on pledgerId column", () => {
			const pledgerIdIndex = tableConfig.indexes.find(
				(idx) =>
					idx.config.columns.length === 1 &&
					getColumnName(idx.config.columns[0]) === "pledger_id",
			);
			expect(pledgerIdIndex).toBeDefined();
			expect(pledgerIdIndex?.config.unique).toBe(false);
		});

		it("should have a unique composite index on campaignId and pledgerId", () => {
			const uniqueIndex = tableConfig.indexes.find(
				(idx) =>
					idx.config.unique === true &&
					idx.config.columns.length === 2 &&
					idx.config.columns.some((c) => getColumnName(c) === "campaign_id") &&
					idx.config.columns.some((c) => getColumnName(c) === "pledger_id"),
			);
			expect(uniqueIndex).toBeDefined();
			expect(uniqueIndex?.config.unique).toBe(true);
		});

		it("should have exactly 5 indexes defined", () => {
			expect(tableConfig.indexes.length).toBe(5);
		});
	});

	describe("fundCampaignPledgesTableRelations", () => {
		// Helper type for captured relation data
		interface CapturedRelation {
			table: Table;
			config: {
				relationName?: string;
				fields?: unknown[];
				references?: unknown[];
			};
		}

		// Type for the mock relation helpers
		interface MockRelationHelpers {
			one: (
				table: Table,
				config?: CapturedRelation["config"],
			) => {
				withFieldName: () => object;
			};
			many: (
				table: Table,
				config?: CapturedRelation["config"],
			) => {
				withFieldName: () => object;
			};
		}

		// Capture all relations by invoking the config function with mock helpers
		let capturedRelations: Record<string, CapturedRelation> = {};

		beforeAll(() => {
			capturedRelations = {};
			(
				fundCampaignPledgesTableRelations.config as unknown as (
					helpers: MockRelationHelpers,
				) => unknown
			)({
				one: (table: Table, config?: CapturedRelation["config"]) => {
					if (config?.relationName?.includes("fund_campaigns")) {
						capturedRelations.campaign = { table, config };
					}
					if (config?.relationName?.includes("creator_id")) {
						capturedRelations.creator = { table, config };
					}
					if (config?.relationName?.includes("pledger_id")) {
						capturedRelations.pledger = { table, config };
					}
					if (config?.relationName?.includes("updater_id")) {
						capturedRelations.updater = { table, config };
					}
					return { withFieldName: () => ({}) };
				},
				many: (_table: Table, _config?: CapturedRelation["config"]) => {
					return { withFieldName: () => ({}) };
				},
			});
		});

		it("should be defined", () => {
			expect(fundCampaignPledgesTableRelations).toBeDefined();
		});

		it("should have the correct table name", () => {
			expect(fundCampaignPledgesTableRelations.table).toBe(
				fundCampaignPledgesTable,
			);
		});

		it("should have config function defined", () => {
			expect(typeof fundCampaignPledgesTableRelations.config).toBe("function");
		});

		describe("campaign relation", () => {
			it("should have campaign relation defined", () => {
				expect(capturedRelations.campaign).toBeDefined();
			});

			it("should reference the fund_campaigns table", () => {
				const table = capturedRelations.campaign?.table;
				expect(table).toBeDefined();
				expect(getTableName(table as Table)).toBe("fund_campaigns");
			});

			it("should have the correct relation name", () => {
				expect(capturedRelations.campaign?.config?.relationName).toBe(
					"fund_campaigns.id:fund_campaign_pledges.campaign_id",
				);
			});
		});

		describe("creator relation", () => {
			it("should have creator relation defined", () => {
				expect(capturedRelations.creator).toBeDefined();
			});

			it("should reference the users table", () => {
				const table = capturedRelations.creator?.table;
				expect(table).toBeDefined();
				expect(getTableName(table as Table)).toBe("users");
			});

			it("should have the correct relation name", () => {
				expect(capturedRelations.creator?.config?.relationName).toBe(
					"fund_campaign_pledges.creator_id:users.id",
				);
			});
		});

		describe("pledger relation", () => {
			it("should have pledger relation defined", () => {
				expect(capturedRelations.pledger).toBeDefined();
			});

			it("should reference the users table", () => {
				const table = capturedRelations.pledger?.table;
				expect(table).toBeDefined();
				expect(getTableName(table as Table)).toBe("users");
			});

			it("should have the correct relation name", () => {
				expect(capturedRelations.pledger?.config?.relationName).toBe(
					"fund_campaign_pledges.pledger_id:users.id",
				);
			});
		});

		describe("updater relation", () => {
			it("should have updater relation defined", () => {
				expect(capturedRelations.updater).toBeDefined();
			});

			it("should reference the users table", () => {
				const table = capturedRelations.updater?.table;
				expect(table).toBeDefined();
				expect(getTableName(table as Table)).toBe("users");
			});

			it("should have the correct relation name", () => {
				expect(capturedRelations.updater?.config?.relationName).toBe(
					"fund_campaign_pledges.updater_id:users.id",
				);
			});
		});
	});
});
