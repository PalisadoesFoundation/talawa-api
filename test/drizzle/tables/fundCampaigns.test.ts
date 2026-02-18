import { getTableName, type Table } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { beforeAll, describe, expect, it } from "vitest";
import {
	fundCampaignsTable,
	fundCampaignsTableInsertSchema,
	fundCampaignsTableRelations,
} from "~/src/drizzle/tables/fundCampaigns";

const NAME_MAX_LENGTH = 256;

describe("fundCampaignsTable", () => {
	describe("fundCampaignsTableInsertSchema", () => {
		const validCampaignData = {
			name: "Annual Fundraising Campaign",
			fundId: "01234567-89ab-4def-8123-456789abcdef",
			currencyCode: "USD",
			goalAmount: 10000,
			startAt: new Date("2024-01-01T00:00:00.000Z"),
			endAt: new Date("2024-12-31T23:59:59.000Z"),
		};

		describe("name field", () => {
			it("should accept a valid name", () => {
				const result =
					fundCampaignsTableInsertSchema.safeParse(validCampaignData);
				expect(result.success).toBe(true);
			});

			it("should accept name with minimum length (1 character)", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					name: "A",
				});
				expect(result.success).toBe(true);
			});

			it("should accept name with maximum length (256 characters)", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					name: "A".repeat(NAME_MAX_LENGTH),
				});
				expect(result.success).toBe(true);
			});

			it("should reject an empty name", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					name: "",
				});
				expect(result.success).toBe(false);
			});

			it("should reject name exceeding maximum length", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					name: "A".repeat(NAME_MAX_LENGTH + 1),
				});
				expect(result.success).toBe(false);
			});

			it("should reject missing name", () => {
				const { name: _name, ...dataWithoutName } = validCampaignData;
				const result =
					fundCampaignsTableInsertSchema.safeParse(dataWithoutName);
				expect(result.success).toBe(false);
			});

			it("should reject null name", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					name: null,
				});
				expect(result.success).toBe(false);
			});

			it("should reject undefined name", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					name: undefined,
				});
				expect(result.success).toBe(false);
			});
		});

		describe("fundId field", () => {
			it("should accept a valid UUID", () => {
				const result =
					fundCampaignsTableInsertSchema.safeParse(validCampaignData);
				expect(result.success).toBe(true);
			});

			it("should reject missing fundId", () => {
				const { fundId: _fundId, ...dataWithoutFundId } = validCampaignData;
				const result =
					fundCampaignsTableInsertSchema.safeParse(dataWithoutFundId);
				expect(result.success).toBe(false);
			});

			it("should reject invalid UUID format", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					fundId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject null fundId", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					fundId: null,
				});
				expect(result.success).toBe(false);
			});

			it("should reject undefined fundId", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					fundId: undefined,
				});
				expect(result.success).toBe(false);
			});
		});

		describe("currencyCode field", () => {
			it("should accept valid currency code USD", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					currencyCode: "USD",
				});
				expect(result.success).toBe(true);
			});

			it("should accept valid currency code EUR", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					currencyCode: "EUR",
				});
				expect(result.success).toBe(true);
			});

			it("should accept valid currency code GBP", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					currencyCode: "GBP",
				});
				expect(result.success).toBe(true);
			});

			it("should accept valid currency code JPY", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					currencyCode: "JPY",
				});
				expect(result.success).toBe(true);
			});

			it("should accept valid currency code INR", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					currencyCode: "INR",
				});
				expect(result.success).toBe(true);
			});

			it("should reject invalid currency code", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					currencyCode: "INVALID",
				});
				expect(result.success).toBe(false);
			});

			it("should reject missing currencyCode", () => {
				const { currencyCode: _currencyCode, ...dataWithoutCurrencyCode } =
					validCampaignData;
				const result = fundCampaignsTableInsertSchema.safeParse(
					dataWithoutCurrencyCode,
				);
				expect(result.success).toBe(false);
			});

			it("should reject null currencyCode", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					currencyCode: null,
				});
				expect(result.success).toBe(false);
			});

			it("should reject lowercase currency code", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					currencyCode: "usd",
				});
				expect(result.success).toBe(false);
			});
		});

		describe("goalAmount field", () => {
			it("should accept a valid positive amount", () => {
				const result =
					fundCampaignsTableInsertSchema.safeParse(validCampaignData);
				expect(result.success).toBe(true);
			});

			it("should accept minimum amount (1)", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					goalAmount: 1,
				});
				expect(result.success).toBe(true);
			});

			it("should accept large amount values", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					goalAmount: 1000000000,
				});
				expect(result.success).toBe(true);
			});

			it("should reject missing goalAmount", () => {
				const { goalAmount: _goalAmount, ...dataWithoutGoalAmount } =
					validCampaignData;
				const result = fundCampaignsTableInsertSchema.safeParse(
					dataWithoutGoalAmount,
				);
				expect(result.success).toBe(false);
			});

			it("should reject null goalAmount", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					goalAmount: null,
				});
				expect(result.success).toBe(false);
			});

			it("should reject undefined goalAmount", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					goalAmount: undefined,
				});
				expect(result.success).toBe(false);
			});

			it("should reject string goalAmount", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					goalAmount: "10000",
				});
				expect(result.success).toBe(false);
			});

			it("should accept negative goalAmount (validation not enforced at schema level)", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					goalAmount: -100,
				});
				expect(result.success).toBe(true);
			});

			it("should accept zero goalAmount (validation not enforced at schema level)", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					goalAmount: 0,
				});
				expect(result.success).toBe(true);
			});
		});

		describe("amountRaised field", () => {
			it("should accept a valid positive amount", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					amountRaised: 5000,
				});
				expect(result.success).toBe(true);
			});

			it("should accept zero amountRaised", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					amountRaised: 0,
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined amountRaised (uses default 0)", () => {
				const result =
					fundCampaignsTableInsertSchema.safeParse(validCampaignData);
				expect(result.success).toBe(true);
			});

			it("should accept negative amountRaised (validation not enforced at schema level)", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					amountRaised: -100,
				});
				expect(result.success).toBe(true);
			});

			it("should reject string amountRaised", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					amountRaised: "5000",
				});
				expect(result.success).toBe(false);
			});
		});

		describe("startAt field", () => {
			it("should accept a valid date", () => {
				const result =
					fundCampaignsTableInsertSchema.safeParse(validCampaignData);
				expect(result.success).toBe(true);
			});

			it("should accept past date", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					startAt: new Date("2020-01-01T00:00:00.000Z"),
				});
				expect(result.success).toBe(true);
			});

			it("should accept future date", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					startAt: new Date("2030-01-01T00:00:00.000Z"),
				});
				expect(result.success).toBe(true);
			});

			it("should reject missing startAt", () => {
				const { startAt: _startAt, ...dataWithoutStartAt } = validCampaignData;
				const result =
					fundCampaignsTableInsertSchema.safeParse(dataWithoutStartAt);
				expect(result.success).toBe(false);
			});

			it("should reject null startAt", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					startAt: null,
				});
				expect(result.success).toBe(false);
			});

			it("should reject string startAt", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					startAt: "2024-01-01",
				});
				expect(result.success).toBe(false);
			});

			it("should reject invalid date startAt", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					startAt: new Date("invalid"),
				});
				expect(result.success).toBe(false);
			});
		});

		describe("endAt field", () => {
			it("should accept a valid date", () => {
				const result =
					fundCampaignsTableInsertSchema.safeParse(validCampaignData);
				expect(result.success).toBe(true);
			});

			it("should accept date after startAt", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					startAt: new Date("2024-01-01T00:00:00.000Z"),
					endAt: new Date("2024-12-31T23:59:59.000Z"),
				});
				expect(result.success).toBe(true);
			});

			it("should reject missing endAt", () => {
				const { endAt: _endAt, ...dataWithoutEndAt } = validCampaignData;
				const result =
					fundCampaignsTableInsertSchema.safeParse(dataWithoutEndAt);
				expect(result.success).toBe(false);
			});

			it("should reject null endAt", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					endAt: null,
				});
				expect(result.success).toBe(false);
			});

			it("should reject string endAt", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					endAt: "2024-12-31",
				});
				expect(result.success).toBe(false);
			});

			it("should reject invalid date endAt", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					endAt: new Date("invalid"),
				});
				expect(result.success).toBe(false);
			});
		});

		describe("id field", () => {
			it("should accept a valid UUID for id", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					id: "01234567-89ab-4def-8123-456789abcdef",
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined id (auto-generated)", () => {
				const result =
					fundCampaignsTableInsertSchema.safeParse(validCampaignData);
				expect(result.success).toBe(true);
			});

			it("should reject invalid UUID format for id", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					id: "not-a-valid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject null id", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					id: null,
				});
				expect(result.success).toBe(false);
			});
		});

		describe("creatorId field", () => {
			it("should accept a valid UUID for creatorId", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					creatorId: "01234567-89ab-4def-9123-456789abcdef",
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined creatorId (optional field)", () => {
				const result =
					fundCampaignsTableInsertSchema.safeParse(validCampaignData);
				expect(result.success).toBe(true);
			});

			it("should accept null creatorId (nullable field)", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					creatorId: null,
				});
				expect(result.success).toBe(true);
			});

			it("should reject invalid UUID format for creatorId", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					creatorId: "invalid",
				});
				expect(result.success).toBe(false);
			});
		});

		describe("updaterId field", () => {
			it("should accept a valid UUID for updaterId", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					updaterId: "01234567-89ab-4def-9123-456789abcdef",
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined updaterId (optional field)", () => {
				const result =
					fundCampaignsTableInsertSchema.safeParse(validCampaignData);
				expect(result.success).toBe(true);
			});

			it("should accept null updaterId (nullable field)", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					updaterId: null,
				});
				expect(result.success).toBe(true);
			});

			it("should reject invalid UUID format for updaterId", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					updaterId: "invalid",
				});
				expect(result.success).toBe(false);
			});
		});

		describe("complete campaign data", () => {
			it("should accept complete valid campaign data", () => {
				const completeCampaignData = {
					name: "Annual Community Campaign",
					fundId: "01234567-89ab-4def-8123-456789abcdef",
					currencyCode: "USD",
					goalAmount: 50000,
					amountRaised: 25000,
					startAt: new Date("2024-01-01T00:00:00.000Z"),
					endAt: new Date("2024-12-31T23:59:59.000Z"),
					creatorId: "01234567-89ab-4def-9123-456789abcdef",
					updaterId: "01234567-89ab-4def-9123-456789abcdef",
				};
				const result =
					fundCampaignsTableInsertSchema.safeParse(completeCampaignData);
				expect(result.success).toBe(true);
			});

			it("should reject empty object", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({});
				expect(result.success).toBe(false);
			});

			it("should reject null", () => {
				const result = fundCampaignsTableInsertSchema.safeParse(null);
				expect(result.success).toBe(false);
			});

			it("should reject undefined", () => {
				const result = fundCampaignsTableInsertSchema.safeParse(undefined);
				expect(result.success).toBe(false);
			});

			it("should accept data with explicit createdAt timestamp", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					createdAt: new Date(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept data with explicit updatedAt timestamp", () => {
				const result = fundCampaignsTableInsertSchema.safeParse({
					...validCampaignData,
					updatedAt: new Date(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept data without createdAt (uses default)", () => {
				const result =
					fundCampaignsTableInsertSchema.safeParse(validCampaignData);
				expect(result.success).toBe(true);
			});

			it("should accept data without updatedAt (uses default)", () => {
				const result =
					fundCampaignsTableInsertSchema.safeParse(validCampaignData);
				expect(result.success).toBe(true);
			});
		});
	});

	describe("fundCampaignsTable structure", () => {
		it("should have createdAt column", () => {
			expect(fundCampaignsTable.createdAt).toBeDefined();
			expect(fundCampaignsTable.createdAt.name).toBe("created_at");
		});

		it("should have creatorId column", () => {
			expect(fundCampaignsTable.creatorId).toBeDefined();
			expect(fundCampaignsTable.creatorId.name).toBe("creator_id");
		});

		it("should have currencyCode column", () => {
			expect(fundCampaignsTable.currencyCode).toBeDefined();
			expect(fundCampaignsTable.currencyCode.name).toBe("currency_code");
		});

		it("should have endAt column", () => {
			expect(fundCampaignsTable.endAt).toBeDefined();
			expect(fundCampaignsTable.endAt.name).toBe("end_at");
		});

		it("should have fundId column", () => {
			expect(fundCampaignsTable.fundId).toBeDefined();
			expect(fundCampaignsTable.fundId.name).toBe("fund_id");
		});

		it("should have goalAmount column", () => {
			expect(fundCampaignsTable.goalAmount).toBeDefined();
			expect(fundCampaignsTable.goalAmount.name).toBe("goal_amount");
		});

		it("should have amountRaised column", () => {
			expect(fundCampaignsTable.amountRaised).toBeDefined();
			expect(fundCampaignsTable.amountRaised.name).toBe("amount_raised");
		});

		it("should have id column as primary key", () => {
			expect(fundCampaignsTable.id).toBeDefined();
			expect(fundCampaignsTable.id.name).toBe("id");
		});

		it("should have name column", () => {
			expect(fundCampaignsTable.name).toBeDefined();
			expect(fundCampaignsTable.name.name).toBe("name");
		});

		it("should have startAt column", () => {
			expect(fundCampaignsTable.startAt).toBeDefined();
			expect(fundCampaignsTable.startAt.name).toBe("start_at");
		});

		it("should have updatedAt column", () => {
			expect(fundCampaignsTable.updatedAt).toBeDefined();
			expect(fundCampaignsTable.updatedAt.name).toBe("updated_at");
		});

		it("should have updaterId column", () => {
			expect(fundCampaignsTable.updaterId).toBeDefined();
			expect(fundCampaignsTable.updaterId.name).toBe("updater_id");
		});
	});

	describe("fundCampaignsTable indexes", () => {
		const tableConfig = getTableConfig(fundCampaignsTable);

		// Helper function to get column name from indexed column
		const getColumnName = (
			col: (typeof tableConfig.indexes)[0]["config"]["columns"][0] | undefined,
		): string | undefined => {
			if (col && "name" in col) {
				return col.name as string;
			}
			return undefined;
		};

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

		it("should have an index on endAt column", () => {
			const endAtIndex = tableConfig.indexes.find(
				(idx) =>
					idx.config.columns.length === 1 &&
					getColumnName(idx.config.columns[0]) === "end_at",
			);
			expect(endAtIndex).toBeDefined();
			expect(endAtIndex?.config.unique).toBe(false);
		});

		it("should have an index on fundId column", () => {
			const fundIdIndex = tableConfig.indexes.find(
				(idx) =>
					idx.config.columns.length === 1 &&
					getColumnName(idx.config.columns[0]) === "fund_id",
			);
			expect(fundIdIndex).toBeDefined();
			expect(fundIdIndex?.config.unique).toBe(false);
		});

		it("should have an index on name column", () => {
			const nameIndex = tableConfig.indexes.find(
				(idx) =>
					idx.config.columns.length === 1 &&
					getColumnName(idx.config.columns[0]) === "name",
			);
			expect(nameIndex).toBeDefined();
			expect(nameIndex?.config.unique).toBe(false);
		});

		it("should have an index on startAt column", () => {
			const startAtIndex = tableConfig.indexes.find(
				(idx) =>
					idx.config.columns.length === 1 &&
					getColumnName(idx.config.columns[0]) === "start_at",
			);
			expect(startAtIndex).toBeDefined();
			expect(startAtIndex?.config.unique).toBe(false);
		});

		it("should have a unique composite index on fundId and name", () => {
			const uniqueIndex = tableConfig.indexes.find(
				(idx) =>
					idx.config.unique === true &&
					idx.config.columns.length === 2 &&
					idx.config.columns.some((c) => getColumnName(c) === "fund_id") &&
					idx.config.columns.some((c) => getColumnName(c) === "name"),
			);
			expect(uniqueIndex).toBeDefined();
			expect(uniqueIndex?.config.unique).toBe(true);
		});

		it("should have exactly 7 indexes defined", () => {
			expect(tableConfig.indexes.length).toBe(7);
		});
	});

	describe("fundCampaignsTable foreign keys", () => {
		const tableConfig = getTableConfig(fundCampaignsTable);

		it("should have 3 foreign keys", () => {
			expect(tableConfig.foreignKeys.length).toBe(3);
		});

		it("should have foreign key to users table (creator)", () => {
			const fk = tableConfig.foreignKeys.find(
				(fk) => fk.getName() === "fund_campaigns_creator_id_users_id_fk",
			);
			expect(fk).toBeDefined();
			// this manually triggers the reference function if not already triggered
			expect(fk?.reference().foreignTable).toBeDefined();
		});

		it("should have foreign key to funds table", () => {
			const fk = tableConfig.foreignKeys.find(
				(fk) => fk.getName() === "fund_campaigns_fund_id_funds_id_fk",
			);
			expect(fk).toBeDefined();
			expect(fk?.reference().foreignTable).toBeDefined();
		});

		it("should have foreign key to users table (updater)", () => {
			const fk = tableConfig.foreignKeys.find(
				(fk) => fk.getName() === "fund_campaigns_updater_id_users_id_fk",
			);
			expect(fk).toBeDefined();
			expect(fk?.reference().foreignTable).toBeDefined();
		});

		it("should have onDelete and onUpdate for creator foreign key", () => {
			const fk = tableConfig.foreignKeys.find(
				(fk: { reference: () => { columns: Array<{ name: string }> } }) => {
					const ref = fk.reference();
					return ref.columns.some(
						(col: { name: string }) => col.name === "creator_id",
					);
				},
			);
			expect(fk).toBeDefined();
			expect((fk as { onDelete?: string })?.onDelete).toBe("set null");
			expect((fk as { onUpdate?: string })?.onUpdate).toBe("cascade");
			const reference = fk?.reference();
			expect(reference?.foreignTable).toBeDefined();
		});

		it("should have onDelete and onUpdate for fund foreign key", () => {
			const fk = tableConfig.foreignKeys.find(
				(fk: { reference: () => { columns: Array<{ name: string }> } }) => {
					const ref = fk.reference();
					return ref.columns.some(
						(col: { name: string }) => col.name === "fund_id",
					);
				},
			);
			expect(fk).toBeDefined();
			expect((fk as { onDelete?: string })?.onDelete).toBe("cascade");
			expect((fk as { onUpdate?: string })?.onUpdate).toBe("cascade");
			const reference = fk?.reference();
			expect(reference?.foreignTable).toBeDefined();
		});

		it("should have onDelete and onUpdate for updater foreign key", () => {
			const fk = tableConfig.foreignKeys.find(
				(fk: { reference: () => { columns: Array<{ name: string }> } }) => {
					const ref = fk.reference();
					return ref.columns.some(
						(col: { name: string }) => col.name === "updater_id",
					);
				},
			);
			expect(fk).toBeDefined();
			expect((fk as { onDelete?: string })?.onDelete).toBe("set null");
			expect((fk as { onUpdate?: string })?.onUpdate).toBe("cascade");
			const reference = fk?.reference();
			expect(reference?.foreignTable).toBeDefined();
		});
	});

	describe("fundCampaignsTable defaults and updates", () => {
		it("should have defaultFn for updatedAt", () => {
			// accessing internal property to verify function existence for coverage
			const defaultFn = fundCampaignsTable.updatedAt.defaultFn;
			expect(defaultFn).toBeDefined();
			if (typeof defaultFn === "function") {
				expect(defaultFn()).toBeDefined();
			}
		});

		it("should have onUpdateFn for updatedAt", () => {
			// accessing internal property to verify function existence for coverage
			const onUpdateFn = fundCampaignsTable.updatedAt.onUpdateFn;
			expect(onUpdateFn).toBeDefined();
			if (typeof onUpdateFn === "function") {
				expect(onUpdateFn()).toBeInstanceOf(Date);
			}
		});

		it("should have defaultFn for id", () => {
			// accessing internal property to verify function existence for coverage
			const defaultFn = fundCampaignsTable.id.defaultFn;
			expect(defaultFn).toBeDefined();
			if (typeof defaultFn === "function") {
				const generatedId = defaultFn();
				expect(generatedId).toBeDefined();
				expect(typeof generatedId).toBe("string");
			}
		});

		it("should have default value for amountRaised", () => {
			// accessing internal property to verify default value existence
			const hasDefault = fundCampaignsTable.amountRaised.hasDefault;
			expect(hasDefault).toBe(true);
		});
	});

	describe("fundCampaignsTableRelations", () => {
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
				fundCampaignsTableRelations.config as unknown as (
					helpers: MockRelationHelpers,
				) => unknown
			)({
				one: (table: Table, config?: CapturedRelation["config"]) => {
					if (config?.relationName?.includes("creator_id")) {
						capturedRelations.creator = { table, config };
					}
					if (config?.relationName?.includes("fund_id")) {
						capturedRelations.fund = { table, config };
					}
					if (config?.relationName?.includes("updater_id")) {
						capturedRelations.updater = { table, config };
					}
					return { withFieldName: () => ({}) };
				},
				many: (table: Table, config?: CapturedRelation["config"]) => {
					if (config?.relationName?.includes("fund_campaign_pledges")) {
						capturedRelations.fundCampaignPledgesWhereCampaign = {
							table,
							config,
						};
					}
					return { withFieldName: () => ({}) };
				},
			});
		});

		it("should be defined", () => {
			expect(fundCampaignsTableRelations).toBeDefined();
		});

		it("should have the correct table name", () => {
			expect(fundCampaignsTableRelations.table).toBe(fundCampaignsTable);
		});

		it("should have config function defined", () => {
			expect(typeof fundCampaignsTableRelations.config).toBe("function");
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
					"fund_campaigns.creator_id:users.id",
				);
			});

			it("should have correct FK field mapping", () => {
				const fields = capturedRelations.creator?.config?.fields;
				expect(fields).toBeDefined();
				expect(Array.isArray(fields)).toBe(true);
				expect(fields?.length).toBe(1);
			});

			it("should have correct FK reference mapping", () => {
				const references = capturedRelations.creator?.config?.references;
				expect(references).toBeDefined();
				expect(Array.isArray(references)).toBe(true);
				expect(references?.length).toBe(1);
			});
		});

		describe("fund relation", () => {
			it("should have fund relation defined", () => {
				expect(capturedRelations.fund).toBeDefined();
			});

			it("should reference the funds table", () => {
				const table = capturedRelations.fund?.table;
				expect(table).toBeDefined();
				expect(getTableName(table as Table)).toBe("funds");
			});

			it("should have the correct relation name", () => {
				expect(capturedRelations.fund?.config?.relationName).toBe(
					"fund_campaigns.fund_id:funds.id",
				);
			});

			it("should have correct FK field mapping", () => {
				const fields = capturedRelations.fund?.config?.fields;
				expect(fields).toBeDefined();
				expect(Array.isArray(fields)).toBe(true);
				expect(fields?.length).toBe(1);
			});

			it("should have correct FK reference mapping", () => {
				const references = capturedRelations.fund?.config?.references;
				expect(references).toBeDefined();
				expect(Array.isArray(references)).toBe(true);
				expect(references?.length).toBe(1);
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
					"fund_campaigns.updater_id:users.id",
				);
			});

			it("should have correct FK field mapping", () => {
				const fields = capturedRelations.updater?.config?.fields;
				expect(fields).toBeDefined();
				expect(Array.isArray(fields)).toBe(true);
				expect(fields?.length).toBe(1);
			});

			it("should have correct FK reference mapping", () => {
				const references = capturedRelations.updater?.config?.references;
				expect(references).toBeDefined();
				expect(Array.isArray(references)).toBe(true);
				expect(references?.length).toBe(1);
			});
		});

		describe("fundCampaignPledgesWhereCampaign relation", () => {
			it("should have fundCampaignPledgesWhereCampaign relation defined", () => {
				expect(
					capturedRelations.fundCampaignPledgesWhereCampaign,
				).toBeDefined();
			});

			it("should reference the fund_campaign_pledges table", () => {
				const table = capturedRelations.fundCampaignPledgesWhereCampaign?.table;
				expect(table).toBeDefined();
				expect(getTableName(table as Table)).toBe("fund_campaign_pledges");
			});

			it("should have the correct relation name", () => {
				expect(
					capturedRelations.fundCampaignPledgesWhereCampaign?.config
						?.relationName,
				).toBe("fund_campaigns.id:fund_campaign_pledges.campaign_id");
			});
		});
	});
});
