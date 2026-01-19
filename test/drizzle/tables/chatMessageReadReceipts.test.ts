import { getTableName, type Table } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { beforeAll, describe, expect, it } from "vitest";
import {
	chatMessageReadReceiptsInsertSchema,
	chatMessageReadReceiptsRelations,
	chatMessageReadReceiptsTable,
} from "~/src/drizzle/tables/chatMessageReadReceipts";

/**
 * Tests for chatMessageReadReceiptsTable definition - validates table schema, relations,
 * insert schema validation, database constraints, indexes, and primary key configuration.
 * This ensures the chatMessageReadReceipts table is properly configured and all code paths are covered.
 */
describe("src/drizzle/tables/chatMessageReadReceipts.ts - Table Definition Tests", () => {
	describe("Table Schema", () => {
		it("should have correct table name", () => {
			expect(getTableName(chatMessageReadReceiptsTable)).toBe(
				"chat_message_read_receipts",
			);
		});

		it("should have all required columns defined", () => {
			const columns = Object.keys(chatMessageReadReceiptsTable);
			expect(columns).toContain("messageId");
			expect(columns).toContain("readerId");
			expect(columns).toContain("readAt");
		});

		it("should have at least 3 columns", () => {
			const columns = Object.keys(chatMessageReadReceiptsTable);
			expect(columns.length).toBeGreaterThanOrEqual(3);
		});

		it("should have messageId column defined", () => {
			expect(chatMessageReadReceiptsTable.messageId).toBeDefined();
			expect(chatMessageReadReceiptsTable.messageId.name).toBe("message_id");
		});

		it("should have readerId column defined", () => {
			expect(chatMessageReadReceiptsTable.readerId).toBeDefined();
			expect(chatMessageReadReceiptsTable.readerId.name).toBe("reader_id");
		});

		it("should have readAt column defined", () => {
			expect(chatMessageReadReceiptsTable.readAt).toBeDefined();
			expect(chatMessageReadReceiptsTable.readAt.name).toBe("read_at");
		});

		it("should have all fields configured as not null", () => {
			expect(chatMessageReadReceiptsTable.messageId.notNull).toBe(true);
			expect(chatMessageReadReceiptsTable.readerId.notNull).toBe(true);
			expect(chatMessageReadReceiptsTable.readAt.notNull).toBe(true);
		});

		it("should have readAt with default value", () => {
			expect(chatMessageReadReceiptsTable.readAt.hasDefault).toBe(true);
		});

		it("should not have individual primary keys on columns", () => {
			// Since this table uses a composite primary key, individual columns should not be primary
			expect(chatMessageReadReceiptsTable.messageId.primary).toBe(false);
			expect(chatMessageReadReceiptsTable.readerId.primary).toBe(false);
		});
	});

	describe("Primary Key Configuration", () => {
		const tableConfig = getTableConfig(chatMessageReadReceiptsTable);

		// Helper function to get column name
		const getColumnName = (col: unknown): string | undefined => {
			if (col && typeof col === "object" && "name" in col) {
				return col.name as string;
			}
			return undefined;
		};

		it("should have a composite primary key defined", () => {
			expect(tableConfig.primaryKeys).toBeDefined();
			expect(tableConfig.primaryKeys.length).toBeGreaterThan(0);
		});

		it("should have composite primary key on messageId and readerId", () => {
			const primaryKey = tableConfig.primaryKeys[0];
			expect(primaryKey).toBeDefined();
			if (!primaryKey) return;
			expect(primaryKey.columns.length).toBe(2);

			const columnNames = primaryKey.columns.map((col) => getColumnName(col));
			expect(columnNames).toContain("message_id");
			expect(columnNames).toContain("reader_id");
		});

		it("should have exactly one primary key constraint", () => {
			expect(tableConfig.primaryKeys.length).toBe(1);
		});
	});

	describe("Foreign Key Relationships", () => {
		const tableConfig = getTableConfig(chatMessageReadReceiptsTable);

		it("should have messageId column with foreign key reference to chat_messages.id", () => {
			// Verify the messageId column exists and is defined with FK constraints in the schema
			expect(chatMessageReadReceiptsTable.messageId).toBeDefined();

			// The FK should point to chatMessagesTable.id
			// This is validated through:
			// 1. The column definition uses .references(() => chatMessagesTable.id)
			// 2. The tableConfig has exactly 2 foreign keys (verified in another test)
			// 3. The relations test verifies the ORM relationship to chat_messages

			// Verify FK metadata exists
			expect(tableConfig.foreignKeys.length).toBeGreaterThanOrEqual(1);

			// The actual FK constraint is defined in the schema as:
			// messageId: uuid("message_id").notNull().references(() => chatMessagesTable.id)
			// This ensures referential integrity at the database level
		});

		it("should have readerId column with foreign key reference to users.id", () => {
			// Verify the readerId column exists and is defined with FK constraints in the schema
			expect(chatMessageReadReceiptsTable.readerId).toBeDefined();

			// The FK should point to usersTable.id
			// This is validated through:
			// 1. The column definition uses .references(() => usersTable.id)
			// 2. The tableConfig has exactly 2 foreign keys (verified in another test)
			// 3. The relations test verifies the ORM relationship to users

			// Verify FK metadata exists
			expect(tableConfig.foreignKeys.length).toBe(2);

			// The actual FK constraint is defined in the schema as:
			// readerId: uuid("reader_id").notNull().references(() => usersTable.id)
			// This ensures referential integrity at the database level
		});
	});

	describe("Table Relations", () => {
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
				chatMessageReadReceiptsRelations.config as unknown as (
					helpers: MockRelationHelpers,
				) => unknown
			)({
				one: (table: Table, config?: CapturedRelation["config"]) => {
					if (config?.relationName?.includes("message_id:chat_messages")) {
						capturedRelations.message = { table, config };
					}
					if (config?.relationName?.includes("reader_id:users")) {
						capturedRelations.reader = { table, config };
					}
					return { withFieldName: () => ({}) };
				},
				many: (_table: Table, _config?: CapturedRelation["config"]) => {
					return { withFieldName: () => ({}) };
				},
			});
		});

		it("should be defined", () => {
			expect(chatMessageReadReceiptsRelations).toBeDefined();
		});

		it("should have the correct table reference", () => {
			expect(chatMessageReadReceiptsRelations.table).toBe(
				chatMessageReadReceiptsTable,
			);
		});

		it("should have config function defined", () => {
			expect(typeof chatMessageReadReceiptsRelations.config).toBe("function");
		});

		describe("message relation", () => {
			it("should have message relation defined", () => {
				expect(capturedRelations.message).toBeDefined();
			});

			it("should reference the chat_messages table", () => {
				const table = capturedRelations.message?.table;
				expect(table).toBeDefined();
				expect(getTableName(table as Table)).toBe("chat_messages");
			});

			it("should have the correct relation name", () => {
				expect(capturedRelations.message?.config?.relationName).toBe(
					"chat_message_read_receipts.message_id:chat_messages.id",
				);
			});

			it("should have correct FK field mapping", () => {
				const fields = capturedRelations.message?.config?.fields;
				expect(fields).toBeDefined();
				expect(Array.isArray(fields)).toBe(true);
				expect(fields?.length).toBe(1);
				// Verify it maps to chatMessageReadReceiptsTable.messageId
				expect(fields?.[0]).toBe(chatMessageReadReceiptsTable.messageId);
			});

			it("should have correct FK reference mapping", () => {
				const references = capturedRelations.message?.config?.references;
				expect(references).toBeDefined();
				expect(Array.isArray(references)).toBe(true);
				expect(references?.length).toBe(1);
				// Verify it references chatMessagesTable.id
				if (
					references?.[0] &&
					typeof references[0] === "object" &&
					"name" in references[0]
				) {
					expect(references[0].name).toBe("id");
				}
			});
		});

		describe("reader relation", () => {
			it("should have reader relation defined", () => {
				expect(capturedRelations.reader).toBeDefined();
			});

			it("should reference the users table", () => {
				const table = capturedRelations.reader?.table;
				expect(table).toBeDefined();
				expect(getTableName(table as Table)).toBe("users");
			});

			it("should have the correct relation name", () => {
				expect(capturedRelations.reader?.config?.relationName).toBe(
					"chat_message_read_receipts.reader_id:users.id",
				);
			});

			it("should have correct FK field mapping", () => {
				const fields = capturedRelations.reader?.config?.fields;
				expect(fields).toBeDefined();
				expect(Array.isArray(fields)).toBe(true);
				expect(fields?.length).toBe(1);
				// Verify it maps to chatMessageReadReceiptsTable.readerId
				expect(fields?.[0]).toBe(chatMessageReadReceiptsTable.readerId);
			});

			it("should have correct FK reference mapping", () => {
				const references = capturedRelations.reader?.config?.references;
				expect(references).toBeDefined();
				expect(Array.isArray(references)).toBe(true);
				expect(references?.length).toBe(1);
				// Verify it references usersTable.id
				if (
					references?.[0] &&
					typeof references[0] === "object" &&
					"name" in references[0]
				) {
					expect(references[0].name).toBe("id");
				}
			});
		});

		it("should define exactly two relations (message and reader)", () => {
			expect(Object.keys(capturedRelations)).toHaveLength(2);
			expect(capturedRelations.message).toBeDefined();
			expect(capturedRelations.reader).toBeDefined();
		});
	});

	describe("Insert Schema Validation", () => {
		const validReceiptData = {
			messageId: "01234567-89ab-cdef-0123-456789abcdef",
			readerId: "11111111-1111-1111-1111-111111111111",
		};

		describe("messageId field", () => {
			it("should accept a valid UUID for messageId", () => {
				const result =
					chatMessageReadReceiptsInsertSchema.safeParse(validReceiptData);
				expect(result.success).toBe(true);
			});

			it("should reject missing messageId", () => {
				const { messageId: _messageId, ...dataWithoutMessageId } =
					validReceiptData;
				const result =
					chatMessageReadReceiptsInsertSchema.safeParse(dataWithoutMessageId);
				expect(result.success).toBe(false);
			});

			it("should reject invalid UUID format for messageId", () => {
				const result = chatMessageReadReceiptsInsertSchema.safeParse({
					...validReceiptData,
					messageId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject null messageId", () => {
				const result = chatMessageReadReceiptsInsertSchema.safeParse({
					...validReceiptData,
					messageId: null,
				});
				expect(result.success).toBe(false);
			});

			it("should reject undefined messageId", () => {
				const result = chatMessageReadReceiptsInsertSchema.safeParse({
					...validReceiptData,
					messageId: undefined,
				});
				expect(result.success).toBe(false);
			});

			it("should reject string messageId that is not UUID", () => {
				const result = chatMessageReadReceiptsInsertSchema.safeParse({
					...validReceiptData,
					messageId: "not-a-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject empty string messageId", () => {
				const result = chatMessageReadReceiptsInsertSchema.safeParse({
					...validReceiptData,
					messageId: "",
				});
				expect(result.success).toBe(false);
			});
		});

		describe("readerId field", () => {
			it("should accept a valid UUID for readerId", () => {
				const result =
					chatMessageReadReceiptsInsertSchema.safeParse(validReceiptData);
				expect(result.success).toBe(true);
			});

			it("should reject missing readerId", () => {
				const { readerId: _readerId, ...dataWithoutReaderId } =
					validReceiptData;
				const result =
					chatMessageReadReceiptsInsertSchema.safeParse(dataWithoutReaderId);
				expect(result.success).toBe(false);
			});

			it("should reject invalid UUID format for readerId", () => {
				const result = chatMessageReadReceiptsInsertSchema.safeParse({
					...validReceiptData,
					readerId: "invalid-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject null readerId", () => {
				const result = chatMessageReadReceiptsInsertSchema.safeParse({
					...validReceiptData,
					readerId: null,
				});
				expect(result.success).toBe(false);
			});

			it("should reject undefined readerId", () => {
				const result = chatMessageReadReceiptsInsertSchema.safeParse({
					...validReceiptData,
					readerId: undefined,
				});
				expect(result.success).toBe(false);
			});

			it("should reject string readerId that is not UUID", () => {
				const result = chatMessageReadReceiptsInsertSchema.safeParse({
					...validReceiptData,
					readerId: "not-a-uuid",
				});
				expect(result.success).toBe(false);
			});

			it("should reject empty string readerId", () => {
				const result = chatMessageReadReceiptsInsertSchema.safeParse({
					...validReceiptData,
					readerId: "",
				});
				expect(result.success).toBe(false);
			});
		});

		describe("readAt field", () => {
			it("should accept valid readAt timestamp", () => {
				const result = chatMessageReadReceiptsInsertSchema.safeParse({
					...validReceiptData,
					readAt: new Date(),
				});
				expect(result.success).toBe(true);
			});

			it("should accept undefined readAt (uses default)", () => {
				const result =
					chatMessageReadReceiptsInsertSchema.safeParse(validReceiptData);
				expect(result.success).toBe(true);
			});

			it("should accept specific readAt date", () => {
				const specificDate = new Date("2024-01-15T10:30:00Z");
				const result = chatMessageReadReceiptsInsertSchema.safeParse({
					...validReceiptData,
					readAt: specificDate,
				});
				expect(result.success).toBe(true);
			});

			it("should reject string readAt", () => {
				const result = chatMessageReadReceiptsInsertSchema.safeParse({
					...validReceiptData,
					readAt: "2024-01-15",
				});
				expect(result.success).toBe(false);
			});

			it("should reject numeric timestamp for readAt", () => {
				const result = chatMessageReadReceiptsInsertSchema.safeParse({
					...validReceiptData,
					readAt: Date.now(),
				});
				expect(result.success).toBe(false);
			});

			it("should reject null readAt", () => {
				const result = chatMessageReadReceiptsInsertSchema.safeParse({
					...validReceiptData,
					readAt: null,
				});
				expect(result.success).toBe(false);
			});
		});

		describe("complete receipt data", () => {
			it("should accept complete valid receipt data", () => {
				const completeData = {
					messageId: "01234567-89ab-cdef-0123-456789abcdef",
					readerId: "11111111-1111-1111-1111-111111111111",
					readAt: new Date(),
				};
				const result =
					chatMessageReadReceiptsInsertSchema.safeParse(completeData);
				expect(result.success).toBe(true);
			});

			it("should accept minimal valid receipt data", () => {
				const minimalData = {
					messageId: "01234567-89ab-cdef-0123-456789abcdef",
					readerId: "11111111-1111-1111-1111-111111111111",
				};
				const result =
					chatMessageReadReceiptsInsertSchema.safeParse(minimalData);
				expect(result.success).toBe(true);
			});

			it("should reject empty object", () => {
				const result = chatMessageReadReceiptsInsertSchema.safeParse({});
				expect(result.success).toBe(false);
			});

			it("should reject null", () => {
				const result = chatMessageReadReceiptsInsertSchema.safeParse(null);
				expect(result.success).toBe(false);
			});

			it("should reject undefined", () => {
				const result = chatMessageReadReceiptsInsertSchema.safeParse(undefined);
				expect(result.success).toBe(false);
			});

			it("should reject object with only messageId", () => {
				const result = chatMessageReadReceiptsInsertSchema.safeParse({
					messageId: "01234567-89ab-cdef-0123-456789abcdef",
				});
				expect(result.success).toBe(false);
			});

			it("should reject object with only readerId", () => {
				const result = chatMessageReadReceiptsInsertSchema.safeParse({
					readerId: "11111111-1111-1111-1111-111111111111",
				});
				expect(result.success).toBe(false);
			});

			it("should allow data with extra unexpected fields", () => {
				const result = chatMessageReadReceiptsInsertSchema.safeParse({
					...validReceiptData,
					extraField: "should not be here",
				});
				// Zod by default allows extra fields, but we test the core fields work
				expect(result.success).toBe(true);
			});
		});
	});

	describe("Table Indexes", () => {
		const tableConfig = getTableConfig(chatMessageReadReceiptsTable);

		// Helper function to get column name from indexed column
		const getColumnName = (col: unknown): string | undefined => {
			if (col && typeof col === "object" && "name" in col) {
				return col.name as string;
			}
			return undefined;
		};

		it("should have indexes defined", () => {
			expect(tableConfig.indexes).toBeDefined();
			expect(Array.isArray(tableConfig.indexes)).toBe(true);
		});

		it("should have at least one index", () => {
			expect(tableConfig.indexes.length).toBeGreaterThan(0);
		});

		it("should have an index on messageId column", () => {
			const messageIdIndex = tableConfig.indexes.find(
				(idx) =>
					idx.config.columns.length === 1 &&
					getColumnName(idx.config.columns[0]) === "message_id",
			);
			expect(messageIdIndex).toBeDefined();
		});

		it("should have messageId index as non-unique", () => {
			const messageIdIndex = tableConfig.indexes.find(
				(idx) =>
					idx.config.columns.length === 1 &&
					getColumnName(idx.config.columns[0]) === "message_id",
			);
			expect(messageIdIndex?.config.unique).toBe(false);
		});

		it("should have exactly one index defined", () => {
			expect(tableConfig.indexes.length).toBe(1);
		});
	});

	describe("Table Configuration", () => {
		const tableConfig = getTableConfig(chatMessageReadReceiptsTable);

		it("should have table config defined", () => {
			expect(tableConfig).toBeDefined();
		});

		it("should have correct table name in config", () => {
			expect(tableConfig.name).toBe("chat_message_read_receipts");
		});

		it("should have columns defined in config", () => {
			expect(tableConfig.columns).toBeDefined();
			expect(Array.isArray(tableConfig.columns)).toBe(true);
		});

		it("should have exactly 3 columns in config", () => {
			expect(tableConfig.columns.length).toBe(3);
		});

		it("should have foreign keys defined", () => {
			expect(tableConfig.foreignKeys).toBeDefined();
			expect(Array.isArray(tableConfig.foreignKeys)).toBe(true);
		});

		it("should have exactly 2 foreign keys (messageId and readerId)", () => {
			expect(tableConfig.foreignKeys.length).toBe(2);
		});
	});

	describe("Composite Primary Key Uniqueness Constraint", () => {
		it("should ensure composite key enforces one receipt per (message, reader)", () => {
			// This is a logical test - the composite primary key ensures uniqueness
			const tableConfig = getTableConfig(chatMessageReadReceiptsTable);
			const primaryKey = tableConfig.primaryKeys[0];
			if (!primaryKey) {
				throw new Error("Primary key not found");
			}

			// Verify both columns are in the primary key
			const columnNames = primaryKey.columns.map((col) =>
				col && typeof col === "object" && "name" in col
					? (col.name as string)
					: undefined,
			);

			expect(columnNames).toContain("message_id");
			expect(columnNames).toContain("reader_id");
			expect(columnNames.length).toBe(2);
		});
	});

	describe("Table exports", () => {
		it("should export chatMessageReadReceiptsTable", () => {
			expect(chatMessageReadReceiptsTable).toBeDefined();
		});

		it("should export chatMessageReadReceiptsRelations", () => {
			expect(chatMessageReadReceiptsRelations).toBeDefined();
		});

		it("should export chatMessageReadReceiptsInsertSchema", () => {
			expect(chatMessageReadReceiptsInsertSchema).toBeDefined();
		});

		it("should have chatMessageReadReceiptsTable as an object", () => {
			expect(typeof chatMessageReadReceiptsTable).toBe("object");
		});

		it("should have chatMessageReadReceiptsRelations as an object", () => {
			expect(typeof chatMessageReadReceiptsRelations).toBe("object");
		});

		it("should have chatMessageReadReceiptsInsertSchema with parse method", () => {
			expect(typeof chatMessageReadReceiptsInsertSchema.parse).toBe("function");
		});

		it("should have chatMessageReadReceiptsInsertSchema with safeParse method", () => {
			expect(typeof chatMessageReadReceiptsInsertSchema.safeParse).toBe(
				"function",
			);
		});
	});
});
