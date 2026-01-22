import { getTableName, type Table } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { beforeAll, describe, expect, it } from "vitest";
import {
	fundsTable,
	fundsTableInsertSchema,
	fundsTableRelations,
} from "~/src/drizzle/tables/funds";

const NAME_MAX_LENGTH = 256;

describe("fundsTable", () => {
	describe("fundsTableInsertSchema", () => {
		const validFundData = {
			name: "Community Fund",
			organizationId: "01234567-89ab-4def-9123-456789abcdef",
			isTaxDeductible: true,
		};

		describe("name field", () => {
			it("should accept a valid name", () => {
				const result = fundsTableInsertSchema.safeParse(validFundData);
				expect(result.success).toBe(true);
			});

			it("should accept name with minimum length (1 character)", () => {
				const result = fundsTableInsertSchema.safeParse({
					...validFundData,
					name: "A",
				});
				expect(result.success).toBe(true);
			});

			it("should accept name with maximum length (256 characters)", () => {
				const result = fundsTableInsertSchema.safeParse({
					...validFundData,
					name: "A".repeat(NAME_MAX_LENGTH),
				});
				expect(result.success).toBe(true);
			});

			it("should reject an empty name", () => {
				const result = fundsTableInsertSchema.safeParse({
					...validFundData,
					name: "",
				});
				expect(result.success).toBe(false);
			});

			it("should reject name exceeding maximum length", () => {
				const result = fundsTableInsertSchema.safeParse({
					...validFundData,
					name: "A".repeat(NAME_MAX_LENGTH + 1),
				});
				expect(result.success).toBe(false);
			});

			it("should reject missing name", () => {
				const { name: _name, ...dataWithoutName } = validFundData;
				const result = fundsTableInsertSchema.safeParse(dataWithoutName);
				expect(result.success).toBe(false);
			});

			it("should reject null name", () => {
				const result = fundsTableInsertSchema.safeParse({
					...validFundData,
					name: null,
				});
				expect(result.success).toBe(false);
			});
		});

		describe("organizationId field", () => {
			it("should accept a valid UUID", () => {
				const result = fundsTableInsertSchema.safeParse(validFundData);
				expect(result.success).toBe(true);
			});

			it("should reject missing organizationId", () => {
				const {
					organizationId: _organizationId,
					...dataWithoutOrganizationId
				} = validFundData;
				const result = fundsTableInsertSchema.safeParse(
					dataWithoutOrganizationId,
				);
				expect(result.success).toBe(false);
			});

			it("should reject invalid UUID format", () => {
				const result = fundsTableInsertSchema.safeParse({
					...validFundData,
					organizationId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject null organizationId", () => {
				const result = fundsTableInsertSchema.safeParse({
					...validFundData,
					organizationId: null,
				});
				expect(result.success).toBe(false);
			});
		});

		describe("isTaxDeductible field", () => {
			it("should accept true value", () => {
				const result = fundsTableInsertSchema.safeParse({
					...validFundData,
					isTaxDeductible: true,
				});
				expect(result.success).toBe(true);
			});

			it("should accept false value", () => {
				const result = fundsTableInsertSchema.safeParse({
					...validFundData,
					isTaxDeductible: false,
				});
				expect(result.success).toBe(true);
			});

			it("should reject missing isTaxDeductible", () => {
				const {
					isTaxDeductible: _isTaxDeductible,
					...dataWithoutTaxDeductible
				} = validFundData;
				const result = fundsTableInsertSchema.safeParse(
					dataWithoutTaxDeductible,
				);
				expect(result.success).toBe(false);
			});

			it("should reject null isTaxDeductible", () => {
				const result = fundsTableInsertSchema.safeParse({
					...validFundData,
					isTaxDeductible: null,
				});
				expect(result.success).toBe(false);
			});

			it("should reject string value for isTaxDeductible", () => {
				const result = fundsTableInsertSchema.safeParse({
					...validFundData,
					isTaxDeductible: "true",
				});
				expect(result.success).toBe(false);
			});
		});

		describe("isDefault field", () => {
			it("should accept true value", () => {
				const result = fundsTableInsertSchema.safeParse({
					...validFundData,
					isDefault: true,
				});
				expect(result.success).toBe(true);
			});

			it("should accept false value", () => {
				const result = fundsTableInsertSchema.safeParse({
					...validFundData,
					isDefault: false,
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined isDefault (uses default false)", () => {
				const result = fundsTableInsertSchema.safeParse(validFundData);
				expect(result.success).toBe(true);
			});
		});

		describe("isArchived field", () => {
			it("should accept true value", () => {
				const result = fundsTableInsertSchema.safeParse({
					...validFundData,
					isArchived: true,
				});
				expect(result.success).toBe(true);
			});

			it("should accept false value", () => {
				const result = fundsTableInsertSchema.safeParse({
					...validFundData,
					isArchived: false,
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined isArchived (uses default false)", () => {
				const result = fundsTableInsertSchema.safeParse(validFundData);
				expect(result.success).toBe(true);
			});
		});

		describe("referenceNumber field", () => {
			it("should accept a valid reference number", () => {
				const result = fundsTableInsertSchema.safeParse({
					...validFundData,
					referenceNumber: "REF-12345",
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined referenceNumber (optional field)", () => {
				const result = fundsTableInsertSchema.safeParse(validFundData);
				expect(result.success).toBe(true);
			});

			it("should accept null referenceNumber (nullable field)", () => {
				const result = fundsTableInsertSchema.safeParse({
					...validFundData,
					referenceNumber: null,
				});
				expect(result.success).toBe(true);
			});
		});

		describe("id field", () => {
			it("should accept a valid UUID for id", () => {
				const result = fundsTableInsertSchema.safeParse({
					...validFundData,
					id: "01234567-89ab-4def-9123-456789abcdef",
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined id (auto-generated)", () => {
				const result = fundsTableInsertSchema.safeParse(validFundData);
				expect(result.success).toBe(true);
			});

			it("should reject invalid UUID format for id", () => {
				const result = fundsTableInsertSchema.safeParse({
					...validFundData,
					id: "not-a-valid-uuid",
				});
				expect(result.success).toBe(false);
			});
		});

		describe("creatorId field", () => {
			it("should accept a valid UUID for creatorId", () => {
				const result = fundsTableInsertSchema.safeParse({
					...validFundData,
					creatorId: "01234567-89ab-4def-9123-456789abcdef",
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined creatorId (optional field)", () => {
				const result = fundsTableInsertSchema.safeParse(validFundData);
				expect(result.success).toBe(true);
			});

			it("should accept null creatorId (nullable field)", () => {
				const result = fundsTableInsertSchema.safeParse({
					...validFundData,
					creatorId: null,
				});
				expect(result.success).toBe(true);
			});

			it("should reject invalid UUID format for creatorId", () => {
				const result = fundsTableInsertSchema.safeParse({
					...validFundData,
					creatorId: "invalid",
				});
				expect(result.success).toBe(false);
			});
		});

		describe("updaterId field", () => {
			it("should accept a valid UUID for updaterId", () => {
				const result = fundsTableInsertSchema.safeParse({
					...validFundData,
					updaterId: "01234567-89ab-4def-9123-456789abcdef",
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined updaterId (optional field)", () => {
				const result = fundsTableInsertSchema.safeParse(validFundData);
				expect(result.success).toBe(true);
			});

			it("should accept null updaterId (nullable field)", () => {
				const result = fundsTableInsertSchema.safeParse({
					...validFundData,
					updaterId: null,
				});
				expect(result.success).toBe(true);
			});

			it("should reject invalid UUID format for updaterId", () => {
				const result = fundsTableInsertSchema.safeParse({
					...validFundData,
					updaterId: "invalid",
				});
				expect(result.success).toBe(false);
			});
		});

		describe("complete fund data", () => {
			it("should accept complete valid fund data", () => {
				const completeFundData = {
					name: "Annual Community Fund",
					organizationId: "01234567-89ab-4def-9123-456789abcdef",
					isTaxDeductible: true,
					isDefault: false,
					isArchived: false,
					referenceNumber: "REF-2024-001",
					creatorId: "22222222-2222-2222-2222-222222222222",
					updaterId: "33333333-3333-3333-3333-333333333333",
				};
				const result = fundsTableInsertSchema.safeParse(completeFundData);
				expect(result.success).toBe(true);
			});

			it("should accept minimal valid fund data", () => {
				const minimalFundData = {
					name: "A",
					organizationId: "01234567-89ab-4def-9123-456789abcdef",
					isTaxDeductible: false,
				};
				const result = fundsTableInsertSchema.safeParse(minimalFundData);
				expect(result.success).toBe(true);
			});

			it("should reject empty object", () => {
				const result = fundsTableInsertSchema.safeParse({});
				expect(result.success).toBe(false);
			});

			it("should reject null", () => {
				const result = fundsTableInsertSchema.safeParse(null);
				expect(result.success).toBe(false);
			});

			it("should reject undefined", () => {
				const result = fundsTableInsertSchema.safeParse(undefined);
				expect(result.success).toBe(false);
			});

			it("should accept data with explicit createdAt timestamp", () => {
				const result = fundsTableInsertSchema.safeParse({
					...validFundData,
					createdAt: new Date(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept data with explicit updatedAt timestamp", () => {
				const result = fundsTableInsertSchema.safeParse({
					...validFundData,
					updatedAt: new Date(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept data without createdAt (uses default)", () => {
				const result = fundsTableInsertSchema.safeParse(validFundData);
				expect(result.success).toBe(true);
			});

			it("should accept data without updatedAt (uses default)", () => {
				const result = fundsTableInsertSchema.safeParse(validFundData);
				expect(result.success).toBe(true);
			});
		});
	});

	describe("fundsTable structure", () => {
		it("should have createdAt column", () => {
			expect(fundsTable.createdAt).toBeDefined();
			expect(fundsTable.createdAt.name).toBe("created_at");
		});

		it("should have creatorId column", () => {
			expect(fundsTable.creatorId).toBeDefined();
			expect(fundsTable.creatorId.name).toBe("creator_id");
		});

		it("should have id column as primary key", () => {
			expect(fundsTable.id).toBeDefined();
			expect(fundsTable.id.name).toBe("id");
		});

		it("should have isTaxDeductible column", () => {
			expect(fundsTable.isTaxDeductible).toBeDefined();
			expect(fundsTable.isTaxDeductible.name).toBe("is_tax_deductible");
		});

		it("should have isDefault column", () => {
			expect(fundsTable.isDefault).toBeDefined();
			expect(fundsTable.isDefault.name).toBe("is_default");
		});

		it("should have isArchived column", () => {
			expect(fundsTable.isArchived).toBeDefined();
			expect(fundsTable.isArchived.name).toBe("is_archived");
		});

		it("should have referenceNumber column", () => {
			expect(fundsTable.referenceNumber).toBeDefined();
			expect(fundsTable.referenceNumber.name).toBe("reference_number");
		});

		it("should have name column", () => {
			expect(fundsTable.name).toBeDefined();
			expect(fundsTable.name.name).toBe("name");
		});

		it("should have organizationId column", () => {
			expect(fundsTable.organizationId).toBeDefined();
			expect(fundsTable.organizationId.name).toBe("organization_id");
		});

		it("should have updatedAt column", () => {
			expect(fundsTable.updatedAt).toBeDefined();
			expect(fundsTable.updatedAt.name).toBe("updated_at");
		});

		it("should have updaterId column", () => {
			expect(fundsTable.updaterId).toBeDefined();
			expect(fundsTable.updaterId.name).toBe("updater_id");
		});
	});

	describe("fundsTable indexes", () => {
		const tableConfig = getTableConfig(fundsTable);

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

		it("should have an index on name column", () => {
			const nameIndex = tableConfig.indexes.find(
				(idx) =>
					idx.config.columns.length === 1 &&
					getColumnName(idx.config.columns[0]) === "name",
			);
			expect(nameIndex).toBeDefined();
			expect(nameIndex?.config.unique).toBe(false);
		});

		it("should have an index on organizationId column", () => {
			const organizationIdIndex = tableConfig.indexes.find(
				(idx) =>
					idx.config.columns.length === 1 &&
					getColumnName(idx.config.columns[0]) === "organization_id",
			);
			expect(organizationIdIndex).toBeDefined();
			expect(organizationIdIndex?.config.unique).toBe(false);
		});

		it("should have a unique composite index on name and organizationId", () => {
			const uniqueIndex = tableConfig.indexes.find(
				(idx) =>
					idx.config.unique === true &&
					idx.config.columns.length === 2 &&
					idx.config.columns.some((c) => getColumnName(c) === "name") &&
					idx.config.columns.some(
						(c) => getColumnName(c) === "organization_id",
					),
			);
			expect(uniqueIndex).toBeDefined();
			expect(uniqueIndex?.config.unique).toBe(true);
		});

		it("should have exactly 5 indexes defined", () => {
			expect(tableConfig.indexes.length).toBe(5);
		});
	});

	describe("fundsTable foreign keys", () => {
		const tableConfig = getTableConfig(fundsTable);

		it("should have 3 foreign keys", () => {
			expect(tableConfig.foreignKeys.length).toBe(3);
		});

		it("should have foreign key to users table (creator)", () => {
			const fk = tableConfig.foreignKeys.find(
				(fk) => fk.getName() === "funds_creator_id_users_id_fk",
			);
			expect(fk).toBeDefined();
			// this manually triggers the reference function if not already triggered
			expect(fk?.reference().foreignTable).toBeDefined();
		});

		it("should have foreign key to organizations table", () => {
			const fk = tableConfig.foreignKeys.find(
				(fk) => fk.getName() === "funds_organization_id_organizations_id_fk",
			);
			expect(fk).toBeDefined();
			expect(fk?.reference().foreignTable).toBeDefined();
		});

		it("should have foreign key to users table (updater)", () => {
			const fk = tableConfig.foreignKeys.find(
				(fk) => fk.getName() === "funds_updater_id_users_id_fk",
			);
			expect(fk).toBeDefined();
			expect(fk?.reference().foreignTable).toBeDefined();
		});
	});

	describe("fundsTable defaults and updates", () => {
		it("should have defaultFn for updatedAt", () => {
			// accessing internal property to verify function existence for coverage
			const defaultFn = fundsTable.updatedAt.defaultFn;
			expect(defaultFn).toBeDefined();
			if (typeof defaultFn === "function") {
				expect(defaultFn()).toBeDefined();
			}
		});

		it("should have onUpdateFn for updatedAt", () => {
			// accessing internal property to verify function existence for coverage
			const onUpdateFn = fundsTable.updatedAt.onUpdateFn;
			expect(onUpdateFn).toBeDefined();
			if (typeof onUpdateFn === "function") {
				expect(onUpdateFn()).toBeInstanceOf(Date);
			}
		});
	});

	describe("fundsTableRelations", () => {
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
				fundsTableRelations.config as unknown as (
					helpers: MockRelationHelpers,
				) => unknown
			)({
				one: (table: Table, config?: CapturedRelation["config"]) => {
					if (config?.relationName?.includes("creator_id")) {
						capturedRelations.creator = { table, config };
					}
					if (config?.relationName?.includes("organization_id")) {
						capturedRelations.organization = { table, config };
					}
					if (config?.relationName?.includes("updater_id")) {
						capturedRelations.updater = { table, config };
					}
					return { withFieldName: () => ({}) };
				},
				many: (table: Table, config?: CapturedRelation["config"]) => {
					if (config?.relationName?.includes("fund_campaigns")) {
						capturedRelations.fundCampaignsWhereFund = { table, config };
					}
					return { withFieldName: () => ({}) };
				},
			});
		});

		it("should be defined", () => {
			expect(fundsTableRelations).toBeDefined();
		});

		it("should have the correct table name", () => {
			expect(fundsTableRelations.table).toBe(fundsTable);
		});

		it("should have config function defined", () => {
			expect(typeof fundsTableRelations.config).toBe("function");
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
					"funds.creator_id:users.id",
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

		describe("organization relation", () => {
			it("should have organization relation defined", () => {
				expect(capturedRelations.organization).toBeDefined();
			});

			it("should reference the organizations table", () => {
				const table = capturedRelations.organization?.table;
				expect(table).toBeDefined();
				expect(getTableName(table as Table)).toBe("organizations");
			});

			it("should have the correct relation name", () => {
				expect(capturedRelations.organization?.config?.relationName).toBe(
					"funds.organization_id:organizations.id",
				);
			});

			it("should have correct FK field mapping", () => {
				const fields = capturedRelations.organization?.config?.fields;
				expect(fields).toBeDefined();
				expect(Array.isArray(fields)).toBe(true);
				expect(fields?.length).toBe(1);
			});

			it("should have correct FK reference mapping", () => {
				const references = capturedRelations.organization?.config?.references;
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
					"funds.updater_id:users.id",
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

		describe("fundCampaignsWhereFund relation", () => {
			it("should have fundCampaignsWhereFund relation defined", () => {
				expect(capturedRelations.fundCampaignsWhereFund).toBeDefined();
			});

			it("should reference the fund_campaigns table", () => {
				const table = capturedRelations.fundCampaignsWhereFund?.table;
				expect(table).toBeDefined();
				expect(getTableName(table as Table)).toBe("fund_campaigns");
			});

			it("should have the correct relation name", () => {
				expect(
					capturedRelations.fundCampaignsWhereFund?.config?.relationName,
				).toBe("fund_campaigns.fund_id:funds.id");
			});
		});
	});
});
