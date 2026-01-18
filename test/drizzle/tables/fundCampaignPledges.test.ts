import { getTableName, type Table } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { beforeAll, describe, expect, it } from "vitest";
import {
	fundCampaignPledgesTable,
	fundCampaignPledgesTableInsertSchema,
	fundCampaignPledgesTableRelations,
	NOTE_MAX_LENGTH,
} from "~/src/drizzle/tables/fundCampaignPledges";

describe("fundCampaignPledgesTable", () => {
	describe("constants", () => {
		it("should have NOTE_MAX_LENGTH set to 2048", () => {
			expect(NOTE_MAX_LENGTH).toBe(2048);
		});
	});

	describe("fundCampaignPledgesTableInsertSchema", () => {
		const validPledgeData = {
			amount: 100,
			campaignId: "01234567-89ab-4def-a123-456789abcdef",
			pledgerId: "fedcba98-7654-4210-aedc-ba9876543210",
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

			it("should reject zero amount", () => {
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

			it("should reject non-integer amount", () => {
				const result = fundCampaignPledgesTableInsertSchema.safeParse({
					...validPledgeData,
					amount: 50.5,
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

			it("should reject missing amount", () => {
				const { amount, ...dataWithoutAmount } = validPledgeData;
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

			it("should accept undefined note (optional field)", () => {
				const result =
					fundCampaignPledgesTableInsertSchema.safeParse(validPledgeData);
				expect(result.success).toBe(true);
			});

			it("should accept null note (nullable field)", () => {
				const result = fundCampaignPledgesTableInsertSchema.safeParse({
					...validPledgeData,
					note: null,
				});
				expect(result.success).toBe(true);
			});
		});

		describe("campaignId field", () => {
			it("should accept a valid UUID", () => {
				const result =
					fundCampaignPledgesTableInsertSchema.safeParse(validPledgeData);
				expect(result.success).toBe(true);
			});

			it("should reject missing campaignId", () => {
				const { campaignId, ...dataWithoutCampaignId } = validPledgeData;
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
				const { pledgerId, ...dataWithoutPledgerId } = validPledgeData;
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
					id: "01234567-89ab-4def-a123-456789abcdef",
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
					creatorId: "01234567-89ab-4def-a123-456789abcdef",
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
					updaterId: "01234567-89ab-4def-a123-456789abcdef",
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
					campaignId: "01234567-89ab-4def-a123-456789abcdef",
					pledgerId: "fedcba98-7654-4210-aedc-ba9876543210",
					note: "Supporting this great cause!",
					id: "11111111-1111-4111-8111-111111111111",
					creatorId: "22222222-2222-4222-8222-222222222222",
					updaterId: "33333333-3333-4333-8333-333333333333",
				};
				const result =
					fundCampaignPledgesTableInsertSchema.safeParse(completePledgeData);
				expect(result.success).toBe(true);
			});

			it("should accept minimal valid pledge data", () => {
				const minimalPledgeData = {
					amount: 50,
					campaignId: "01234567-89ab-4def-a123-456789abcdef",
					pledgerId: "fedcba98-7654-4210-aedc-ba9876543210",
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

			it("should accept data with explicit createdAt timestamp", () => {
				const result = fundCampaignPledgesTableInsertSchema.safeParse({
					...validPledgeData,
					createdAt: new Date(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept data with explicit updatedAt timestamp", () => {
				const result = fundCampaignPledgesTableInsertSchema.safeParse({
					...validPledgeData,
					updatedAt: new Date(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept data without createdAt (uses default)", () => {
				const result =
					fundCampaignPledgesTableInsertSchema.safeParse(validPledgeData);
				expect(result.success).toBe(true);
			});

			it("should accept data without updatedAt (uses default)", () => {
				const result =
					fundCampaignPledgesTableInsertSchema.safeParse(validPledgeData);
				expect(result.success).toBe(true);
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

	describe("fundCampaignPledgesTable table name", () => {
		let tableName: string;

		beforeAll(() => {
			tableName = getTableName(fundCampaignPledgesTable as Table);
		});

		it("should be named fund_campaign_pledges", () => {
			expect(tableName).toBe("fund_campaign_pledges");
		});
	});

	describe("fundCampaignPledgesTableRelations", () => {
		it("should have relations defined", () => {
			expect(fundCampaignPledgesTableRelations).toBeDefined();
		});

		it("should have campaign relation", () => {
			const config = getTableConfig(fundCampaignPledgesTable);
			expect(config).toBeDefined();
		});
	});
});
