import { getTableName, type Table } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { beforeAll, describe, expect, it } from "vitest";
import {
	venueBookingsTable,
	venueBookingsTableInsertSchema,
	venueBookingsTableRelations,
} from "~/src/drizzle/tables/venueBookings";

describe("venueBookingsTable", () => {
	describe("venueBookingsTableInsertSchema", () => {
		const validVenueBookingData = {
			eventId: "01234567-89ab-cdef-0123-456789abcdef",
			venueId: "fedcba98-7654-3210-fedc-ba9876543210",
		};

		describe("eventId field", () => {
			it("should accept a valid UUID", () => {
				const result = venueBookingsTableInsertSchema.safeParse(validVenueBookingData);
				expect(result.success).toBe(true);
			});

			it("should reject missing eventId", () => {
				const { eventId, ...dataWithoutEventId } = validVenueBookingData;
				const result = venueBookingsTableInsertSchema.safeParse(dataWithoutEventId);
				expect(result.success).toBe(false);
			});

			it("should reject invalid UUID format", () => {
				const result = venueBookingsTableInsertSchema.safeParse({
					...validVenueBookingData,
					eventId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject null eventId", () => {
				const result = venueBookingsTableInsertSchema.safeParse({
					...validVenueBookingData,
					eventId: null,
				});
				expect(result.success).toBe(false);
			});

			it("should reject undefined eventId", () => {
				const result = venueBookingsTableInsertSchema.safeParse({
					...validVenueBookingData,
					eventId: undefined,
				});
				expect(result.success).toBe(false);
			});
		});

		describe("venueId field", () => {
			it("should accept a valid UUID", () => {
				const result = venueBookingsTableInsertSchema.safeParse(validVenueBookingData);
				expect(result.success).toBe(true);
			});

			it("should reject missing venueId", () => {
				const { venueId, ...dataWithoutVenueId } = validVenueBookingData;
				const result = venueBookingsTableInsertSchema.safeParse(dataWithoutVenueId);
				expect(result.success).toBe(false);
			});

			it("should reject invalid UUID format", () => {
				const result = venueBookingsTableInsertSchema.safeParse({
					...validVenueBookingData,
					venueId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject null venueId", () => {
				const result = venueBookingsTableInsertSchema.safeParse({
					...validVenueBookingData,
					venueId: null,
				});
				expect(result.success).toBe(false);
			});

			it("should reject undefined venueId", () => {
				const result = venueBookingsTableInsertSchema.safeParse({
					...validVenueBookingData,
					venueId: undefined,
				});
				expect(result.success).toBe(false);
			});
		});

		describe("creatorId field", () => {
			it("should accept a valid UUID for creatorId", () => {
				const result = venueBookingsTableInsertSchema.safeParse({
					...validVenueBookingData,
					creatorId: "01234567-89ab-cdef-0123-456789abcdef",
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined creatorId (optional field)", () => {
				const result = venueBookingsTableInsertSchema.safeParse(validVenueBookingData);
				expect(result.success).toBe(true);
			});

			it("should accept null creatorId (nullable field)", () => {
				const result = venueBookingsTableInsertSchema.safeParse({
					...validVenueBookingData,
					creatorId: null,
				});
				expect(result.success).toBe(true);
			});

			it("should reject invalid UUID format for creatorId", () => {
				const result = venueBookingsTableInsertSchema.safeParse({
					...validVenueBookingData,
					creatorId: "invalid",
				});
				expect(result.success).toBe(false);
			});
		});

		describe("createdAt field", () => {
			it("should accept a valid Date for createdAt", () => {
				const result = venueBookingsTableInsertSchema.safeParse({
					...validVenueBookingData,
					createdAt: new Date(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined createdAt (auto-generated)", () => {
				const result = venueBookingsTableInsertSchema.safeParse(validVenueBookingData);
				expect(result.success).toBe(true);
			});

			it("should reject invalid date for createdAt", () => {
				const result = venueBookingsTableInsertSchema.safeParse({
					...validVenueBookingData,
					createdAt: "not-a-date",
				});
				expect(result.success).toBe(false);
			});

			it("should reject null createdAt", () => {
				const result = venueBookingsTableInsertSchema.safeParse({
					...validVenueBookingData,
					createdAt: null,
				});
				expect(result.success).toBe(false);
			});
		});

		describe("complete venue booking data", () => {
			it("should accept complete valid venue booking data", () => {
				const completeVenueBookingData = {
					eventId: "01234567-89ab-cdef-0123-456789abcdef",
					venueId: "fedcba98-7654-3210-fedc-ba9876543210",
					creatorId: "11111111-1111-1111-1111-111111111111",
					createdAt: new Date(),
				};
				const result = venueBookingsTableInsertSchema.safeParse(completeVenueBookingData);
				expect(result.success).toBe(true);
			});

			it("should accept minimal valid venue booking data", () => {
				const result = venueBookingsTableInsertSchema.safeParse(validVenueBookingData);
				expect(result.success).toBe(true);
			});

			it("should reject empty object", () => {
				const result = venueBookingsTableInsertSchema.safeParse({});
				expect(result.success).toBe(false);
			});

			it("should reject null", () => {
				const result = venueBookingsTableInsertSchema.safeParse(null);
				expect(result.success).toBe(false);
			});

			it("should reject undefined", () => {
				const result = venueBookingsTableInsertSchema.safeParse(undefined);
				expect(result.success).toBe(false);
			});
		});
	});

	describe("venueBookingsTable structure", () => {
		it("should have createdAt column", () => {
			expect(venueBookingsTable.createdAt).toBeDefined();
			expect(venueBookingsTable.createdAt.name).toBe("created_at");
		});

		it("should have creatorId column", () => {
			expect(venueBookingsTable.creatorId).toBeDefined();
			expect(venueBookingsTable.creatorId.name).toBe("creator_id");
		});

		it("should have eventId column", () => {
			expect(venueBookingsTable.eventId).toBeDefined();
			expect(venueBookingsTable.eventId.name).toBe("event_id");
		});

		it("should have venueId column", () => {
			expect(venueBookingsTable.venueId).toBeDefined();
			expect(venueBookingsTable.venueId.name).toBe("venue_id");
		});
	});

	describe("venueBookingsTable indexes", () => {
		const tableConfig = getTableConfig(venueBookingsTable);

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

		it("should have an index on eventId column", () => {
			const eventIdIndex = tableConfig.indexes.find(
				(idx) =>
					idx.config.columns.length === 1 &&
					getColumnName(idx.config.columns[0]) === "event_id",
			);
			expect(eventIdIndex).toBeDefined();
			expect(eventIdIndex?.config.unique).toBe(false);
		});

		it("should have an index on venueId column", () => {
			const venueIdIndex = tableConfig.indexes.find(
				(idx) =>
					idx.config.columns.length === 1 &&
					getColumnName(idx.config.columns[0]) === "venue_id",
			);
			expect(venueIdIndex).toBeDefined();
			expect(venueIdIndex?.config.unique).toBe(false);
		});

		it("should have exactly 4 indexes defined", () => {
			expect(tableConfig.indexes.length).toBe(4);
		});
	});

	describe("venueBookingsTableRelations", () => {
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
				venueBookingsTableRelations.config as unknown as (
					helpers: MockRelationHelpers,
				) => unknown
			)({
				one: (table: Table, config?: CapturedRelation["config"]) => {
					if (config?.relationName?.includes("creator")) {
						capturedRelations.creator = { table, config };
					}
					if (config?.relationName?.includes("event")) {
						capturedRelations.event = { table, config };
					}
					if (config?.relationName?.includes("venue")) {
						capturedRelations.venue = { table, config };
					}
					return { withFieldName: () => ({}) };
				},
				many: () => ({ withFieldName: () => ({}) }),
			});
		});

		it("should be defined", () => {
			expect(venueBookingsTableRelations).toBeDefined();
		});

		it("should have the correct table name", () => {
			expect(venueBookingsTableRelations.table).toBe(venueBookingsTable);
		});

		it("should have config function defined", () => {
			expect(typeof venueBookingsTableRelations.config).toBe("function");
		});

		describe("creator relation", () => {
			it("should have creator relation defined", () => {
				expect(capturedRelations.creator).toBeDefined();
			});

			it("should reference the users table", () => {
				expect(capturedRelations.creator?.table).toBeDefined();
			});

			it("should have correct relation name", () => {
				expect(capturedRelations.creator?.config?.relationName).toBe(
					"users.id:venue_bookings.creator_id",
				);
			});
		});

		describe("event relation", () => {
			it("should have event relation defined", () => {
				expect(capturedRelations.event).toBeDefined();
			});

			it("should reference the events table", () => {
				expect(capturedRelations.event?.table).toBeDefined();
			});

			it("should have correct relation name", () => {
				expect(capturedRelations.event?.config?.relationName).toBe(
					"events.id:venue_bookings.event_id",
				);
			});
		});

		describe("venue relation", () => {
			it("should have venue relation defined", () => {
				expect(capturedRelations.venue).toBeDefined();
			});

			it("should reference the venues table", () => {
				expect(capturedRelations.venue?.table).toBeDefined();
			});

			it("should have correct relation name", () => {
				expect(capturedRelations.venue?.config?.relationName).toBe(
					"venue_bookings.venue_id:venues.id",
				);
			});
		});
	});
});