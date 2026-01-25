import { getTableName, type Table } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { beforeAll, describe, expect, it } from "vitest";
import {
	emailNotificationsTable,
	emailNotificationsTableInsertSchema,
	emailNotificationsTableRelations,
} from "~/src/drizzle/tables/EmailNotification";

/**
 * Tests for emailNotificationsTable definition - validates table schema,
 * relations, insert schema validation, indexes, and configuration exports.
 */
describe(
	"src/drizzle/tables/EmailNotification.ts - Table Definition Tests",
	() => {
		describe("Table Schema", () => {
			it("should have correct table name", () => {
				expect(getTableName(emailNotificationsTable)).toBe(
					"email_notifications",
				);
			});

			it("should have all required columns defined", () => {
				const columns = Object.keys(emailNotificationsTable);
				expect(columns).toContain("id");
				expect(columns).toContain("notificationLogId");
				expect(columns).toContain("userId");
				expect(columns).toContain("email");
				expect(columns).toContain("subject");
				expect(columns).toContain("htmlBody");
				expect(columns).toContain("status");
				expect(columns).toContain("sesMessageId");
				expect(columns).toContain("errorMessage");
				expect(columns).toContain("retryCount");
				expect(columns).toContain("maxRetries");
				expect(columns).toContain("sentAt");
				expect(columns).toContain("failedAt");
				expect(columns).toContain("createdAt");
				expect(columns).toContain("updatedAt");
				expect(columns.length).toBeGreaterThanOrEqual(15);
			});

			it("should have correct column names and properties", () => {
				expect(emailNotificationsTable.id.name).toBe("id");
				expect(emailNotificationsTable.id.primary).toBe(true);
				expect(emailNotificationsTable.id.hasDefault).toBe(true);

				expect(emailNotificationsTable.notificationLogId.name).toBe(
					"notification_log_id",
				);
				expect(emailNotificationsTable.notificationLogId.notNull).toBe(true);

				expect(emailNotificationsTable.userId.name).toBe("user_id");
				expect(emailNotificationsTable.userId.notNull).toBe(false);

				expect(emailNotificationsTable.email.name).toBe("email");
				expect(emailNotificationsTable.email.notNull).toBe(true);

				expect(emailNotificationsTable.subject.name).toBe("subject");
				expect(emailNotificationsTable.subject.notNull).toBe(true);

				expect(emailNotificationsTable.htmlBody.name).toBe("html_body");
				expect(emailNotificationsTable.htmlBody.notNull).toBe(true);

				expect(emailNotificationsTable.status.name).toBe("status");
				expect(emailNotificationsTable.status.notNull).toBe(true);
				expect(emailNotificationsTable.status.hasDefault).toBe(true);

				expect(emailNotificationsTable.retryCount.name).toBe("retry_count");
				expect(emailNotificationsTable.retryCount.notNull).toBe(true);
				expect(emailNotificationsTable.retryCount.hasDefault).toBe(true);

				expect(emailNotificationsTable.maxRetries.name).toBe("max_retries");
				expect(emailNotificationsTable.maxRetries.notNull).toBe(true);
				expect(emailNotificationsTable.maxRetries.hasDefault).toBe(true);

				expect(emailNotificationsTable.createdAt.name).toBe("created_at");
				expect(emailNotificationsTable.createdAt.notNull).toBe(true);
				expect(emailNotificationsTable.createdAt.hasDefault).toBe(true);

				expect(emailNotificationsTable.updatedAt.name).toBe("updated_at");
				expect(emailNotificationsTable.updatedAt.notNull).toBe(true);
				expect(emailNotificationsTable.updatedAt.hasDefault).toBe(true);
			});
		});

		describe("Foreign Key Relationships", () => {
			const tableConfig = getTableConfig(emailNotificationsTable);

			it("should have exactly 2 foreign keys defined", () => {
				expect(tableConfig.foreignKeys).toBeDefined();
				expect(Array.isArray(tableConfig.foreignKeys)).toBe(true);
				expect(tableConfig.foreignKeys.length).toBe(2);
			});
		});

		describe("Table Relations", () => {
			interface CapturedRelation {
				table: Table;
				config?: {
					relationName?: string;
					fields?: unknown[];
					references?: unknown[];
				};
			}

			interface MockRelationHelpers {
				one: (
					table: Table,
					config?: CapturedRelation["config"],
				) => {
					withFieldName: () => object;
				};
			}

			let capturedRelations: Record<string, CapturedRelation> = {};
			let totalRelationCount = 0;

			beforeAll(() => {
				capturedRelations = {};
				totalRelationCount = 0;
				(
					emailNotificationsTableRelations.config as unknown as (
						helpers: MockRelationHelpers,
					) => unknown
				)({
					one: (table: Table, config?: CapturedRelation["config"]) => {
						totalRelationCount++;
						if (getTableName(table) === "notification_logs") {
							capturedRelations.notificationLog = { table, config };
						}
						if (getTableName(table) === "users") {
							capturedRelations.user = { table, config };
						}
						return { withFieldName: () => ({}) };
					},
				});
			});

			it("should be defined", () => {
				expect(emailNotificationsTableRelations).toBeDefined();
			});

			it("should have the correct table reference", () => {
				expect(emailNotificationsTableRelations.table).toBe(
					emailNotificationsTable,
				);
			});

			it("should have config function defined", () => {
				expect(typeof emailNotificationsTableRelations.config).toBe("function");
			});

			describe("notificationLog relation", () => {
				it("should be defined with correct configuration", () => {
					expect(capturedRelations.notificationLog).toBeDefined();
					const table = capturedRelations.notificationLog?.table;
					expect(getTableName(table as Table)).toBe("notification_logs");
					expect(capturedRelations.notificationLog?.config?.relationName).toBe(
						"email_notifications.notification_log_id:notification_logs.id",
					);
					const fields = capturedRelations.notificationLog?.config?.fields;
					expect(fields).toBeDefined();
					expect(fields?.[0]).toBe(emailNotificationsTable.notificationLogId);
				});
			});

			describe("user relation", () => {
				it("should be defined with correct configuration", () => {
					expect(capturedRelations.user).toBeDefined();
					const table = capturedRelations.user?.table;
					expect(getTableName(table as Table)).toBe("users");
					expect(capturedRelations.user?.config?.relationName).toBe(
						"email_notifications.user_id:users.id",
					);
					const fields = capturedRelations.user?.config?.fields;
					expect(fields).toBeDefined();
					expect(fields?.[0]).toBe(emailNotificationsTable.userId);
				});
			});

			it("should define exactly two relations (notificationLog, user)", () => {
				expect(totalRelationCount).toBe(2);
				expect(Object.keys(capturedRelations)).toHaveLength(2);
				expect(capturedRelations.notificationLog).toBeDefined();
				expect(capturedRelations.user).toBeDefined();
			});
		});

		describe("Insert Schema Validation", () => {
			const validInsertData = {
				notificationLogId: "01234567-89ab-4def-a123-456789abcdef",
				email: "test@example.com",
				subject: "Notification subject",
				htmlBody: "<p>Hello</p>",
			};

			it("should accept valid minimal data", () => {
				const result = emailNotificationsTableInsertSchema.safeParse(
					validInsertData,
				);
				expect(result.success).toBe(true);
			});

			it("should reject missing required fields", () => {
				const { notificationLogId: _notificationLogId, ...missingLogId } =
					validInsertData;
				expect(
					emailNotificationsTableInsertSchema.safeParse(missingLogId).success,
				).toBe(false);

				const { email: _email, ...missingEmail } = validInsertData;
				expect(
					emailNotificationsTableInsertSchema.safeParse(missingEmail).success,
				).toBe(false);

				const { subject: _subject, ...missingSubject } = validInsertData;
				expect(
					emailNotificationsTableInsertSchema.safeParse(missingSubject).success,
				).toBe(false);

				const { htmlBody: _htmlBody, ...missingHtmlBody } = validInsertData;
				expect(
					emailNotificationsTableInsertSchema.safeParse(missingHtmlBody).success,
				).toBe(false);
			});

			describe("email field", () => {
				it("should reject invalid email format", () => {
					expect(
						emailNotificationsTableInsertSchema.safeParse({
							...validInsertData,
							email: "not-an-email",
						}).success,
					).toBe(false);
				});

				it("should reject empty or overly long email", () => {
					expect(
						emailNotificationsTableInsertSchema.safeParse({
							...validInsertData,
							email: "",
						}).success,
					).toBe(false);

					const longEmail = `${"a".repeat(250)}@test.com`;
					expect(
						emailNotificationsTableInsertSchema.safeParse({
							...validInsertData,
							email: longEmail,
						}).success,
					).toBe(false);
				});
			});

			describe("subject field", () => {
				it("should accept valid subject length", () => {
					const maxSubject = "a".repeat(512);
					expect(
						emailNotificationsTableInsertSchema.safeParse({
							...validInsertData,
							subject: maxSubject,
						}).success,
					).toBe(true);
				});

				it("should reject empty or overly long subject", () => {
					expect(
						emailNotificationsTableInsertSchema.safeParse({
							...validInsertData,
							subject: "",
						}).success,
					).toBe(false);

					const longSubject = "a".repeat(513);
					expect(
						emailNotificationsTableInsertSchema.safeParse({
							...validInsertData,
							subject: longSubject,
						}).success,
					).toBe(false);
				});
			});

			describe("htmlBody field", () => {
				it("should reject empty htmlBody", () => {
					expect(
						emailNotificationsTableInsertSchema.safeParse({
							...validInsertData,
							htmlBody: "",
						}).success,
					).toBe(false);
				});

				it("should accept non-empty htmlBody", () => {
					expect(
						emailNotificationsTableInsertSchema.safeParse({
							...validInsertData,
							htmlBody: "<p>ok</p>",
						}).success,
					).toBe(true);
				});
			});

			describe("status field", () => {
				it("should accept valid status values", () => {
					const statuses = [
						"pending",
						"sent",
						"delivered",
						"bounced",
						"failed",
					];
					statuses.forEach((status) => {
						expect(
							emailNotificationsTableInsertSchema.safeParse({
								...validInsertData,
								status,
							}).success,
						).toBe(true);
					});
				});

				it("should reject invalid status values", () => {
					expect(
						emailNotificationsTableInsertSchema.safeParse({
							...validInsertData,
							status: "unknown",
						}).success,
					).toBe(false);
				});
			});

			describe("userId field", () => {
				it("should accept valid UUID or null", () => {
					expect(
						emailNotificationsTableInsertSchema.safeParse({
							...validInsertData,
							userId: "11111111-1111-4111-a111-111111111111",
						}).success,
					).toBe(true);
					expect(
						emailNotificationsTableInsertSchema.safeParse({
							...validInsertData,
							userId: null,
						}).success,
					).toBe(true);
				});

				it("should reject invalid UUID", () => {
					expect(
						emailNotificationsTableInsertSchema.safeParse({
							...validInsertData,
							userId: "invalid-uuid",
						}).success,
					).toBe(false);
				});
			});

			describe("optional text fields", () => {
				it("should accept optional sesMessageId and errorMessage", () => {
					expect(
						emailNotificationsTableInsertSchema.safeParse({
							...validInsertData,
							sesMessageId: "ses-message-id",
							errorMessage: "error message",
						}).success,
					).toBe(true);
				});
			});

			describe("retry fields", () => {
				it("should accept valid retryCount and maxRetries", () => {
					expect(
						emailNotificationsTableInsertSchema.safeParse({
							...validInsertData,
							retryCount: 1,
							maxRetries: 5,
						}).success,
					).toBe(true);
				});

				it("should reject invalid retryCount or maxRetries types", () => {
					expect(
						emailNotificationsTableInsertSchema.safeParse({
							...validInsertData,
							retryCount: "1",
						}).success,
					).toBe(false);
					expect(
						emailNotificationsTableInsertSchema.safeParse({
							...validInsertData,
							maxRetries: "3",
						}).success,
					).toBe(false);
				});
			});

			describe("timestamp fields", () => {
				it("should accept valid Date objects", () => {
					expect(
						emailNotificationsTableInsertSchema.safeParse({
							...validInsertData,
							sentAt: new Date(),
							failedAt: new Date(),
							createdAt: new Date(),
							updatedAt: new Date(),
						}).success,
					).toBe(true);
				});

				it("should reject invalid timestamp formats", () => {
					expect(
						emailNotificationsTableInsertSchema.safeParse({
							...validInsertData,
							sentAt: "2024-01-01",
						}).success,
					).toBe(false);
					expect(
						emailNotificationsTableInsertSchema.safeParse({
							...validInsertData,
							failedAt: Date.now(),
						}).success,
					).toBe(false);
				});
			});

			it("should reject invalid data", () => {
				expect(emailNotificationsTableInsertSchema.safeParse({}).success).toBe(
					false,
				);
				expect(
					emailNotificationsTableInsertSchema.safeParse(null).success,
				).toBe(false);
			});
		});

		describe("Table Indexes", () => {
			const tableConfig = getTableConfig(emailNotificationsTable);

			const getColumnName = (col: unknown): string | undefined => {
				if (col && typeof col === "object" && "name" in col) {
					return col.name as string;
				}
				return undefined;
			};

			it("should have exactly 4 indexes defined", () => {
				expect(tableConfig.indexes).toBeDefined();
				expect(Array.isArray(tableConfig.indexes)).toBe(true);
				expect(tableConfig.indexes.length).toBe(4);
			});

			it("should have indexes on key columns", () => {
				const indexedColumns = tableConfig.indexes.map(
					(idx) =>
						idx.config.columns[0] && getColumnName(idx.config.columns[0]),
				);
				expect(indexedColumns).toContain("notification_log_id");
				expect(indexedColumns).toContain("user_id");
				expect(indexedColumns).toContain("status");
				expect(indexedColumns).toContain("created_at");
			});

			it("should have all indexes as non-unique", () => {
				tableConfig.indexes.forEach((idx) => {
					expect(idx.config.unique).toBe(false);
				});
			});
		});

		describe("Table Configuration and Exports", () => {
			const tableConfig = getTableConfig(emailNotificationsTable);

			it("should have correct table configuration", () => {
				expect(tableConfig).toBeDefined();
				expect(tableConfig.name).toBe("email_notifications");
				expect(tableConfig.columns.length).toBe(15);
				expect(tableConfig.foreignKeys.length).toBe(2);
				expect(tableConfig.primaryKeys).toBeDefined();
			});

			it("should export all required objects", () => {
				expect(emailNotificationsTable).toBeDefined();
				expect(typeof emailNotificationsTable).toBe("object");
				expect(emailNotificationsTableRelations).toBeDefined();
				expect(typeof emailNotificationsTableRelations).toBe("object");
				expect(emailNotificationsTableInsertSchema).toBeDefined();
				expect(typeof emailNotificationsTableInsertSchema.parse).toBe(
					"function",
				);
				expect(typeof emailNotificationsTableInsertSchema.safeParse).toBe(
					"function",
				);
			});

			it("should have correct column data types", () => {
				expect(emailNotificationsTable.id.dataType).toBe("string");
				expect(emailNotificationsTable.notificationLogId.dataType).toBe("string");
				expect(emailNotificationsTable.userId.dataType).toBe("string");
				expect(emailNotificationsTable.email.dataType).toBe("string");
				expect(emailNotificationsTable.subject.dataType).toBe("string");
				expect(emailNotificationsTable.htmlBody.dataType).toBe("string");
				expect(emailNotificationsTable.status.dataType).toBe("string");
				expect(emailNotificationsTable.retryCount.dataType).toBe("number");
				expect(emailNotificationsTable.maxRetries.dataType).toBe("number");
				expect(emailNotificationsTable.createdAt.dataType).toBe("date");
				expect(emailNotificationsTable.updatedAt.dataType).toBe("date");
				expect(emailNotificationsTable.sentAt.dataType).toBe("date");
				expect(emailNotificationsTable.failedAt.dataType).toBe("date");
			});
		});
	},
);
