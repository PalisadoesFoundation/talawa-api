import { getTableColumns, getTableName } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { venueAttachmentMimeTypeEnum } from "~/src/drizzle/enums/venueAttachmentMimeType";

// Mock drizzle-orm itself to handle relations
vi.mock("drizzle-orm", async (importOriginal) => {
	const actual = await importOriginal<typeof import("drizzle-orm")>();

	// Create a mock 'one' function for relations
	const mockOne = vi.fn().mockImplementation((table, config) => ({
		...config,
		_table: table,
	}));

	// Mock relations function
	const mockRelations = vi.fn().mockImplementation((table, configFn) => {
		// Call the config function with our mock 'one'
		const config = configFn({ one: mockOne });
		return {
			config: vi.fn().mockReturnValue(config),
			_table: table,
		};
	});

	return {
		...actual,
		relations: mockRelations,
	};
});

// Mock drizzle-orm/pg-core to capture index calls
vi.mock("drizzle-orm/pg-core", async (importOriginal) => {
	const actual = await importOriginal<typeof import("drizzle-orm/pg-core")>();

	// Mock index function
	const mockIndex = vi.fn().mockReturnValue({
		on: vi.fn().mockReturnValue({ _indexed: true }),
	});

	return {
		...actual,
		index: mockIndex,
	};
});

// Now mock the specific table files with proper structure
vi.mock("~/src/drizzle/tables/users", () => ({
	usersTable: {
		_: { name: "users" },
		id: {
			name: "id",
			_: { name: "id" },
			config: {},
			brand: "PgUUID",
		},
	},
}));

vi.mock("~/src/drizzle/tables/venues", () => ({
	venuesTable: {
		_: { name: "venues" },
		id: {
			name: "id",
			_: { name: "id" },
			config: {},
			brand: "PgUUID",
		},
	},
}));

// Mock any other tables that might be imported indirectly
vi.mock("~/src/drizzle/tables/agendaItemAttachments", () => ({}));
vi.mock("~/src/drizzle/tables/agendaItems", () => ({}));
vi.mock("~/src/drizzle/tables/organizations", () => ({}));

import {
	venueAttachmentsTable,
	venueAttachmentsTableInsertSchema,
} from "~/src/drizzle/tables/venueAttachments";

describe("venueAttachments.ts", () => {
	describe("venueAttachmentsTable", () => {
		it("should have the correct table name", () => {
			expect(getTableName(venueAttachmentsTable)).toBe("venue_attachments");
		});

		it("should have all expected columns", () => {
			const columns = getTableColumns(venueAttachmentsTable);
			const columnNames = Object.keys(columns);

			expect(columnNames).toHaveLength(7);
			expect(columnNames).toContain("createdAt");
			expect(columnNames).toContain("creatorId");
			expect(columnNames).toContain("mimeType");
			expect(columnNames).toContain("name");
			expect(columnNames).toContain("updatedAt");
			expect(columnNames).toContain("updaterId");
			expect(columnNames).toContain("venueId");
		});

		it("should have columns with correct data types", () => {
			const columns = getTableColumns(venueAttachmentsTable);

			// Check that createdAt is a timestamp column
			expect(columns.createdAt).toBeDefined();
			expect(columns.createdAt.name).toBe("created_at");

			// Check that mimeType is a text column with enum
			expect(columns.mimeType).toBeDefined();
			expect(columns.mimeType.name).toBe("mime_type");

			// Check that name is a text column
			expect(columns.name).toBeDefined();
			expect(columns.name.name).toBe("name");

			// Check that venueId is a uuid column
			expect(columns.venueId).toBeDefined();
			expect(columns.venueId.name).toBe("venue_id");
		});
	});

	describe("venueAttachmentsTableInsertSchema", () => {
		it("should be a Zod schema", () => {
			expect(venueAttachmentsTableInsertSchema).toBeDefined();
			expect(typeof venueAttachmentsTableInsertSchema.parse).toBe("function");
			expect(typeof venueAttachmentsTableInsertSchema.safeParse).toBe(
				"function",
			);
		});

		it("should validate required fields", () => {
			// Test missing all fields
			const result1 = venueAttachmentsTableInsertSchema.safeParse({});
			expect(result1.success).toBe(false);

			// Test missing mimeType
			const result2 = venueAttachmentsTableInsertSchema.safeParse({
				name: "Test Attachment",
				venueId: "123e4567-e89b-12d3-a456-426614174000",
			});
			expect(result2.success).toBe(false);

			// Test missing name
			const result3 = venueAttachmentsTableInsertSchema.safeParse({
				mimeType: "image/jpeg",
				venueId: "123e4567-e89b-12d3-a456-426614174000",
			});
			expect(result3.success).toBe(false);

			// Test missing venueId
			const result4 = venueAttachmentsTableInsertSchema.safeParse({
				mimeType: "image/jpeg",
				name: "Test Attachment",
			});
			expect(result4.success).toBe(false);
		});

		it("should reject invalid UUID format for venueId", () => {
			const result = venueAttachmentsTableInsertSchema.safeParse({
				mimeType: "image/jpeg",
				name: "Test Attachment",
				venueId: "not-a-valid-uuid",
			});
			expect(result.success).toBe(false);
		});

		it("should accept valid data with required fields", () => {
			const result = venueAttachmentsTableInsertSchema.safeParse({
				mimeType: "image/jpeg",
				name: "Test Attachment",
				venueId: "123e4567-e89b-12d3-a456-426614174000",
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.mimeType).toBe("image/jpeg");
				expect(result.data.name).toBe("Test Attachment");
				expect(result.data.venueId).toBe(
					"123e4567-e89b-12d3-a456-426614174000",
				);
			}
		});

		it("should validate mimeType against enum values", () => {
			// Test valid mime types
			const validMimeTypes = venueAttachmentMimeTypeEnum.options;

			validMimeTypes.forEach((mimeType) => {
				const result = venueAttachmentsTableInsertSchema.safeParse({
					mimeType,
					name: "Test",
					venueId: "123e4567-e89b-12d3-a456-426614174000",
				});
				expect(result.success).toBe(true);
			});

			// Test invalid mime type
			const invalidResult = venueAttachmentsTableInsertSchema.safeParse({
				mimeType: "invalid/type",
				name: "Test",
				venueId: "123e4567-e89b-12d3-a456-426614174000",
			});
			expect(invalidResult.success).toBe(false);
		});

		it("should validate name minimum length", () => {
			// Test empty name
			const emptyResult = venueAttachmentsTableInsertSchema.safeParse({
				mimeType: "image/jpeg",
				name: "",
				venueId: "123e4567-e89b-12d3-a456-426614174000",
			});
			expect(emptyResult.success).toBe(false);

			// Test valid name with 1 character
			const validResult = venueAttachmentsTableInsertSchema.safeParse({
				mimeType: "image/jpeg",
				name: "A",
				venueId: "123e4567-e89b-12d3-a456-426614174000",
			});
			expect(validResult.success).toBe(true);

			// Test longer valid name
			const longerResult = venueAttachmentsTableInsertSchema.safeParse({
				mimeType: "image/jpeg",
				name: "Test Venue Attachment Photo",
				venueId: "123e4567-e89b-12d3-a456-426614174000",
			});
			expect(longerResult.success).toBe(true);
		});

		it("should accept optional creatorId and updaterId fields", () => {
			// Without optional fields
			const result1 = venueAttachmentsTableInsertSchema.safeParse({
				mimeType: "image/jpeg",
				name: "Test Attachment",
				venueId: "123e4567-e89b-12d3-a456-426614174000",
			});
			expect(result1.success).toBe(true);

			// With optional fields
			const result2 = venueAttachmentsTableInsertSchema.safeParse({
				mimeType: "image/jpeg",
				name: "Test Attachment",
				venueId: "123e4567-e89b-12d3-a456-426614174000",
				creatorId: "123e4567-e89b-12d3-a456-426614174001",
				updaterId: "123e4567-e89b-12d3-a456-426614174002",
			});
			expect(result2.success).toBe(true);
		});

		it("should validate creatorId and updaterId as UUIDs when provided", () => {
			// Test invalid UUID for creatorId
			const result1 = venueAttachmentsTableInsertSchema.safeParse({
				mimeType: "image/jpeg",
				name: "Test Attachment",
				venueId: "123e4567-e89b-12d3-a456-426614174000",
				creatorId: "invalid-uuid",
			});
			expect(result1.success).toBe(false);

			// Test invalid UUID for updaterId
			const result2 = venueAttachmentsTableInsertSchema.safeParse({
				mimeType: "image/jpeg",
				name: "Test Attachment",
				venueId: "123e4567-e89b-12d3-a456-426614174000",
				updaterId: "invalid-uuid",
			});
			expect(result2.success).toBe(false);

			// Test valid UUIDs for both
			const result3 = venueAttachmentsTableInsertSchema.safeParse({
				mimeType: "image/jpeg",
				name: "Test Attachment",
				venueId: "123e4567-e89b-12d3-a456-426614174000",
				creatorId: "123e4567-e89b-12d3-a456-426614174001",
				updaterId: "123e4567-e89b-12d3-a456-426614174002",
			});
			expect(result3.success).toBe(true);

			// Test that they're optional (can be omitted)
			const result4 = venueAttachmentsTableInsertSchema.safeParse({
				mimeType: "image/jpeg",
				name: "Test Attachment",
				venueId: "123e4567-e89b-12d3-a456-426614174000",
			});
			expect(result4.success).toBe(true);
		});

		it("should transform data correctly", () => {
			const result = venueAttachmentsTableInsertSchema.parse({
				mimeType: "image/png",
				name: "Test Attachment",
				venueId: "123e4567-e89b-12d3-a456-426614174000",
			});

			expect(result.mimeType).toBe("image/png");
			expect(result.name).toBe("Test Attachment");
			expect(result.venueId).toBe("123e4567-e89b-12d3-a456-426614174000");
		});
	});

	describe("Trigger Index Configuration Execution", () => {
		it("should execute index configuration function with proper self parameter", () => {
			// Get the symbol that contains the ExtraConfigBuilder
			const symbols = Object.getOwnPropertySymbols(venueAttachmentsTable);

			// Look for the ExtraConfigBuilder symbol
			const extraConfigBuilderSymbol = symbols.find((sym) =>
				sym.toString().includes("ExtraConfigBuilder"),
			);

			expect(extraConfigBuilderSymbol).toBeDefined();

			if (extraConfigBuilderSymbol) {
				// Type-safe way to access symbol property
				const venueTableWithSymbol =
					venueAttachmentsTable as typeof venueAttachmentsTable & {
						[key: symbol]: unknown;
					};
				const builder = venueTableWithSymbol[extraConfigBuilderSymbol];

				// Use Vitest assertion instead of throwing
				expect(typeof builder).toBe("function");

				// Type guard or assertion for the function
				const configBuilder = builder as (
					self: Record<string, unknown>,
				) => unknown[];

				// Create a proper 'self' object with the actual columns
				const columns = getTableColumns(venueAttachmentsTable);
				const self: Record<string, unknown> = {};

				// Add all columns to self
				Object.keys(columns).forEach((key) => {
					self[key] = columns[key as keyof typeof columns];
				});

				// Now call the builder with the proper self parameter
				const result = configBuilder(self);

				expect(result).toBeDefined();
				// Should return an array of indexes
				expect(Array.isArray(result)).toBe(true);
				// Make sure ALL 3 index calls execute
				expect(result.length).toBe(3);
			}
		});
	});

	describe("Relation Configuration Verification", () => {
		describe("venueAttachmentsTableRelations", () => {
			// Helper function to get the relation configuration
			async function getVenueAttachmentsRelationConfig() {
				const drizzle = await import("drizzle-orm");
				const mockedRelations = drizzle.relations as ReturnType<typeof vi.fn>;

				const venueAttachmentsCall = mockedRelations.mock.calls.find(
					(call) => call[0] === venueAttachmentsTable,
				);

				if (!venueAttachmentsCall) {
					throw new Error(
						"venueAttachmentsTable not found in relations() calls",
					);
				}

				const configFn = venueAttachmentsCall[1];

				const capturedRelations: Array<{
					config: {
						fields: unknown[];
						references: unknown[];
						relationName?: string;
					};
				}> = [];

				const spyOne = vi.fn().mockImplementation((table, config) => {
					capturedRelations.push({ config });
					return { ...config, _table: table };
				});

				const spyMany = vi.fn();

				configFn({ one: spyOne, many: spyMany });

				return { capturedRelations, spyOne };
			}

			it("should verify that three relations are defined", async () => {
				const { spyOne, capturedRelations } =
					await getVenueAttachmentsRelationConfig();

				// Should have created exactly 3 relations
				expect(spyOne).toHaveBeenCalledTimes(3);
				expect(capturedRelations).toHaveLength(3);
			});

			it("should have creator relation mapping creatorId to users.id", async () => {
				const { capturedRelations } = await getVenueAttachmentsRelationConfig();

				// Find the creator relation by its field
				const creatorRelation = capturedRelations.find((rel) => {
					const fields = rel.config.fields as Array<{ name?: string }>;
					return fields.some((field) => field?.name === "creator_id");
				});

				expect(creatorRelation).toBeDefined();
				if (!creatorRelation) return;

				// Verify creatorId field exists
				const hasCreatorId = (
					creatorRelation.config.fields as Array<{ name?: string }>
				).some((field) => field?.name === "creator_id");
				expect(hasCreatorId).toBe(true);

				// Verify references users.id
				const referencesId = (
					creatorRelation.config.references as Array<{ name?: string }>
				).some((ref) => ref?.name === "id");
				expect(referencesId).toBe(true);

				// Verify relation name
				expect(creatorRelation.config.relationName).toBe(
					"users.id:venue_attachments.creator_id",
				);
			});

			it("should have updater relation mapping updaterId to users.id", async () => {
				const { capturedRelations } = await getVenueAttachmentsRelationConfig();

				// Find the updater relation
				const updaterRelation = capturedRelations.find((rel) => {
					const fields = rel.config.fields as Array<{ name?: string }>;
					return fields.some((field) => field?.name === "updater_id");
				});

				expect(updaterRelation).toBeDefined();
				if (!updaterRelation) return;

				const hasUpdaterId = (
					updaterRelation.config.fields as Array<{ name?: string }>
				).some((field) => field?.name === "updater_id");
				expect(hasUpdaterId).toBe(true);

				const referencesId = (
					updaterRelation.config.references as Array<{ name?: string }>
				).some((ref) => ref?.name === "id");
				expect(referencesId).toBe(true);

				expect(updaterRelation.config.relationName).toBe(
					"users.id:venue_attachments.updater_id",
				);
			});

			it("should have venue relation mapping venueId to venues.id", async () => {
				const { capturedRelations } = await getVenueAttachmentsRelationConfig();

				// Find the venue relation
				const venueRelation = capturedRelations.find((rel) => {
					const fields = rel.config.fields as Array<{ name?: string }>;
					return fields.some((field) => field?.name === "venue_id");
				});

				expect(venueRelation).toBeDefined();
				if (!venueRelation) return;

				const hasVenueId = (
					venueRelation.config.fields as Array<{ name?: string }>
				).some((field) => field?.name === "venue_id");
				expect(hasVenueId).toBe(true);

				const referencesId = (
					venueRelation.config.references as Array<{ name?: string }>
				).some((ref) => ref?.name === "id");
				expect(referencesId).toBe(true);

				expect(venueRelation.config.relationName).toBe(
					"venue_attachments.venue_id:venues.id",
				);
			});
		});
	});
});
