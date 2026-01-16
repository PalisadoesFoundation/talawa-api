import { getTableName, type Table } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import {
	VENUE_DESCRIPTION_MAX_LENGTH,
	VENUE_NAME_MAX_LENGTH,
	venuesTable,
	venuesTableInsertSchema,
	venuesTableRelations,
} from "~/src/drizzle/tables/venues";

/**
 * Tests for venuesTable and venuesTableInsertSchema.
 * Validates schema constraints for venue creation.
 */
describe("venuesTable", () => {
	describe("constants", () => {
		it("should have VENUE_DESCRIPTION_MAX_LENGTH set to 2048", () => {
			expect(VENUE_DESCRIPTION_MAX_LENGTH).toBe(2048);
		});

		it("should have VENUE_NAME_MAX_LENGTH set to 256", () => {
			expect(VENUE_NAME_MAX_LENGTH).toBe(256);
		});
	});

	describe("venuesTableInsertSchema", () => {
		const validVenueData = {
			name: "Conference Room A",
			organizationId: "01234567-89ab-cdef-0123-456789abcdef",
		};

		describe("name field", () => {
			it("should accept a valid name", () => {
				const result = venuesTableInsertSchema.safeParse(validVenueData);
				expect(result.success).toBe(true);
			});

			it("should accept a name with minimum length (1 character)", () => {
				const result = venuesTableInsertSchema.safeParse({
					...validVenueData,
					name: "A",
				});
				expect(result.success).toBe(true);
			});

			it("should accept a name with maximum length (256 characters)", () => {
				const result = venuesTableInsertSchema.safeParse({
					...validVenueData,
					name: "A".repeat(VENUE_NAME_MAX_LENGTH),
				});
				expect(result.success).toBe(true);
			});

			it("should reject an empty name", () => {
				const result = venuesTableInsertSchema.safeParse({
					...validVenueData,
					name: "",
				});
				expect(result.success).toBe(false);
			});

			it("should reject a name exceeding maximum length", () => {
				const result = venuesTableInsertSchema.safeParse({
					...validVenueData,
					name: "A".repeat(VENUE_NAME_MAX_LENGTH + 1),
				});
				expect(result.success).toBe(false);
			});

			it("should reject missing name", () => {
				const { name, ...dataWithoutName } = validVenueData;
				const result = venuesTableInsertSchema.safeParse(dataWithoutName);
				expect(result.success).toBe(false);
			});

			it("should reject null name", () => {
				const result = venuesTableInsertSchema.safeParse({
					...validVenueData,
					name: null,
				});
				expect(result.success).toBe(false);
			});

			it("should reject undefined name", () => {
				const result = venuesTableInsertSchema.safeParse({
					...validVenueData,
					name: undefined,
				});
				expect(result.success).toBe(false);
			});
		});

		describe("description field", () => {
			it("should accept a valid description", () => {
				const result = venuesTableInsertSchema.safeParse({
					...validVenueData,
					description: "A large conference room with projector.",
				});
				expect(result.success).toBe(true);
			});

			it("should accept description with minimum length (1 character)", () => {
				const result = venuesTableInsertSchema.safeParse({
					...validVenueData,
					description: "A",
				});
				expect(result.success).toBe(true);
			});

			it("should accept description with maximum length (2048 characters)", () => {
				const result = venuesTableInsertSchema.safeParse({
					...validVenueData,
					description: "A".repeat(VENUE_DESCRIPTION_MAX_LENGTH),
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined description (optional field)", () => {
				const result = venuesTableInsertSchema.safeParse(validVenueData);
				expect(result.success).toBe(true);
			});

			it("should reject an empty description", () => {
				const result = venuesTableInsertSchema.safeParse({
					...validVenueData,
					description: "",
				});
				expect(result.success).toBe(false);
			});

			it("should reject description exceeding maximum length", () => {
				const result = venuesTableInsertSchema.safeParse({
					...validVenueData,
					description: "A".repeat(VENUE_DESCRIPTION_MAX_LENGTH + 1),
				});
				expect(result.success).toBe(false);
			});
		});

		describe("capacity field", () => {
			it("should accept a valid capacity", () => {
				const result = venuesTableInsertSchema.safeParse({
					...validVenueData,
					capacity: 100,
				});
				expect(result.success).toBe(true);
			});

			it("should accept zero capacity", () => {
				const result = venuesTableInsertSchema.safeParse({
					...validVenueData,
					capacity: 0,
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined capacity (optional field)", () => {
				const result = venuesTableInsertSchema.safeParse(validVenueData);
				expect(result.success).toBe(true);
			});

			it("should accept null capacity (nullable field)", () => {
				const result = venuesTableInsertSchema.safeParse({
					...validVenueData,
					capacity: null,
				});
				expect(result.success).toBe(true);
			});

			it("should reject non-integer capacity", () => {
				const result = venuesTableInsertSchema.safeParse({
					...validVenueData,
					capacity: 50.5,
				});
				expect(result.success).toBe(false);
			});

			it("should reject string capacity", () => {
				const result = venuesTableInsertSchema.safeParse({
					...validVenueData,
					capacity: "100",
				});
				expect(result.success).toBe(false);
			});
		});

		describe("organizationId field", () => {
			it("should accept a valid UUID", () => {
				const result = venuesTableInsertSchema.safeParse(validVenueData);
				expect(result.success).toBe(true);
			});

			it("should reject missing organizationId", () => {
				const { organizationId, ...dataWithoutOrgId } = validVenueData;
				const result = venuesTableInsertSchema.safeParse(dataWithoutOrgId);
				expect(result.success).toBe(false);
			});

			it("should reject invalid UUID format", () => {
				const result = venuesTableInsertSchema.safeParse({
					...validVenueData,
					organizationId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject null organizationId", () => {
				const result = venuesTableInsertSchema.safeParse({
					...validVenueData,
					organizationId: null,
				});
				expect(result.success).toBe(false);
			});
		});

		describe("id field", () => {
			it("should accept a valid UUID for id", () => {
				const result = venuesTableInsertSchema.safeParse({
					...validVenueData,
					id: "01234567-89ab-cdef-0123-456789abcdef",
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined id (auto-generated)", () => {
				const result = venuesTableInsertSchema.safeParse(validVenueData);
				expect(result.success).toBe(true);
			});

			it("should reject invalid UUID format for id", () => {
				const result = venuesTableInsertSchema.safeParse({
					...validVenueData,
					id: "not-a-valid-uuid",
				});
				expect(result.success).toBe(false);
			});
		});

		describe("creatorId field", () => {
			it("should accept a valid UUID for creatorId", () => {
				const result = venuesTableInsertSchema.safeParse({
					...validVenueData,
					creatorId: "01234567-89ab-cdef-0123-456789abcdef",
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined creatorId (optional field)", () => {
				const result = venuesTableInsertSchema.safeParse(validVenueData);
				expect(result.success).toBe(true);
			});

			it("should accept null creatorId (nullable field)", () => {
				const result = venuesTableInsertSchema.safeParse({
					...validVenueData,
					creatorId: null,
				});
				expect(result.success).toBe(true);
			});

			it("should reject invalid UUID format for creatorId", () => {
				const result = venuesTableInsertSchema.safeParse({
					...validVenueData,
					creatorId: "invalid",
				});
				expect(result.success).toBe(false);
			});
		});

		describe("updaterId field", () => {
			it("should accept a valid UUID for updaterId", () => {
				const result = venuesTableInsertSchema.safeParse({
					...validVenueData,
					updaterId: "01234567-89ab-cdef-0123-456789abcdef",
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined updaterId (optional field)", () => {
				const result = venuesTableInsertSchema.safeParse(validVenueData);
				expect(result.success).toBe(true);
			});

			it("should accept null updaterId (nullable field)", () => {
				const result = venuesTableInsertSchema.safeParse({
					...validVenueData,
					updaterId: null,
				});
				expect(result.success).toBe(true);
			});

			it("should reject invalid UUID format for updaterId", () => {
				const result = venuesTableInsertSchema.safeParse({
					...validVenueData,
					updaterId: "invalid",
				});
				expect(result.success).toBe(false);
			});
		});

		describe("complete venue data", () => {
			it("should accept complete valid venue data", () => {
				const completeVenueData = {
					name: "Main Auditorium",
					description: "A large auditorium for events and conferences.",
					organizationId: "01234567-89ab-cdef-0123-456789abcdef",
					capacity: 500,
					creatorId: "11111111-1111-1111-1111-111111111111",
					updaterId: "22222222-2222-2222-2222-222222222222",
				};
				const result = venuesTableInsertSchema.safeParse(completeVenueData);
				expect(result.success).toBe(true);
			});

			it("should accept minimal valid venue data", () => {
				const minimalVenueData = {
					name: "Room 1",
					organizationId: "01234567-89ab-cdef-0123-456789abcdef",
				};
				const result = venuesTableInsertSchema.safeParse(minimalVenueData);
				expect(result.success).toBe(true);
			});

			it("should reject empty object", () => {
				const result = venuesTableInsertSchema.safeParse({});
				expect(result.success).toBe(false);
			});

			it("should reject null", () => {
				const result = venuesTableInsertSchema.safeParse(null);
				expect(result.success).toBe(false);
			});

			it("should reject undefined", () => {
				const result = venuesTableInsertSchema.safeParse(undefined);
				expect(result.success).toBe(false);
			});
		});
	});

	describe("venuesTable structure", () => {
		it("should have createdAt column", () => {
			expect(venuesTable.createdAt).toBeDefined();
			expect(venuesTable.createdAt.name).toBe("created_at");
		});

		it("should have creatorId column", () => {
			expect(venuesTable.creatorId).toBeDefined();
			expect(venuesTable.creatorId.name).toBe("creator_id");
		});

		it("should have name column", () => {
			expect(venuesTable.name).toBeDefined();
			expect(venuesTable.name.name).toBe("name");
		});

		it("should have organizationId column", () => {
			expect(venuesTable.organizationId).toBeDefined();
			expect(venuesTable.organizationId.name).toBe("organization_id");
		});

		it("should have capacity column", () => {
			expect(venuesTable.capacity).toBeDefined();
			expect(venuesTable.capacity.name).toBe("capacity");
		});

		it("should have description column", () => {
			expect(venuesTable.description).toBeDefined();
			expect(venuesTable.description.name).toBe("description");
		});

		it("should have id column as primary key", () => {
			expect(venuesTable.id).toBeDefined();
			expect(venuesTable.id.name).toBe("id");
		});

		it("should have updatedAt column", () => {
			expect(venuesTable.updatedAt).toBeDefined();
			expect(venuesTable.updatedAt.name).toBe("updated_at");
		});

		it("should have updaterId column", () => {
			expect(venuesTable.updaterId).toBeDefined();
			expect(venuesTable.updaterId.name).toBe("updater_id");
		});
	});

	describe("venuesTable indexes", () => {
		const tableConfig = getTableConfig(venuesTable);

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

	describe("venuesTableRelations", () => {
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
		const capturedRelations: Record<string, CapturedRelation> = {};

		(
			venuesTableRelations.config as unknown as (
				helpers: MockRelationHelpers,
			) => unknown
		)({
			one: (table: Table, config?: CapturedRelation["config"]) => {
				if (config?.relationName?.includes("creator")) {
					capturedRelations.creator = { table, config };
				}
				if (config?.relationName?.includes("organization")) {
					capturedRelations.organization = { table, config };
				}
				if (config?.relationName?.includes("updater")) {
					capturedRelations.updater = { table, config };
				}
				// Return mock with withFieldName method required by drizzle
				return { withFieldName: () => ({}) };
			},
			many: (table: Table, config?: CapturedRelation["config"]) => {
				if (config?.relationName?.includes("attachments")) {
					capturedRelations.attachmentsWhereVenue = { table, config };
				}
				if (config?.relationName?.includes("bookings")) {
					capturedRelations.venueBookingsWhereVenue = { table, config };
				}
				// Return mock with withFieldName method required by drizzle
				return { withFieldName: () => ({}) };
			},
		});

		it("should be defined", () => {
			expect(venuesTableRelations).toBeDefined();
		});

		it("should have the correct table name", () => {
			expect(venuesTableRelations.table).toBe(venuesTable);
		});

		it("should have config function defined", () => {
			expect(typeof venuesTableRelations.config).toBe("function");
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
					"users.id:venues.creator_id",
				);
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
					"organizations.id:venues.organization_id",
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
					"users.id:venues.updater_id",
				);
			});
		});

		describe("attachmentsWhereVenue relation", () => {
			it("should have attachmentsWhereVenue relation defined", () => {
				expect(capturedRelations.attachmentsWhereVenue).toBeDefined();
			});

			it("should reference the venue_attachments table", () => {
				const table = capturedRelations.attachmentsWhereVenue?.table;
				expect(table).toBeDefined();
				expect(getTableName(table as Table)).toBe("venue_attachments");
			});

			it("should have the correct relation name", () => {
				expect(
					capturedRelations.attachmentsWhereVenue?.config?.relationName,
				).toBe("venue_attachments.venue_id:venues.id");
			});
		});

		describe("venueBookingsWhereVenue relation", () => {
			it("should have venueBookingsWhereVenue relation defined", () => {
				expect(capturedRelations.venueBookingsWhereVenue).toBeDefined();
			});

			it("should reference the venue_bookings table", () => {
				const table = capturedRelations.venueBookingsWhereVenue?.table;
				expect(table).toBeDefined();
				expect(getTableName(table as Table)).toBe("venue_bookings");
			});

			it("should have the correct relation name", () => {
				expect(
					capturedRelations.venueBookingsWhereVenue?.config?.relationName,
				).toBe("venue_bookings.venue_id:venues.id");
			});
		});
	});
});
