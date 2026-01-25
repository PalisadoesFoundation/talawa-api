import { getTableName, type Table } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { beforeAll, describe, expect, it } from "vitest";
import {
	emailNotificationsTable,
	emailNotificationsTableInsertSchema,
	emailNotificationsTableRelations,
} from "~/src/drizzle/tables/EmailNotification";
import { notificationLogsTable } from "~/src/drizzle/tables/NotificationLog";
import { usersTable } from "~/src/drizzle/tables/users";

const VALID_UUID = "01234567-89ab-4def-a123-456789abcdef";
const VALID_USER_UUID = "11111111-1111-4111-a111-111111111111";
const VALID_EMAIL = "test@example.com";
const VALID_SUBJECT = "Notification subject";
const VALID_HTML_BODY = "<p>Hello</p>";
const STATUS_VALUES = [
	"pending",
	"sent",
	"delivered",
	"bounced",
	"failed",
] as const;

const getColumnName = (col: unknown) =>
	col && typeof col === "object" && "name" in col
		? ((col as { name?: string }).name as string)
		: undefined;

/**
 * Tests for emailNotificationsTable definition - validates table schema,
 * relations, insert schema validation, indexes, and configuration exports.
 */
describe("src/drizzle/tables/EmailNotification.ts - Table Definition Tests", () => {
	describe("Table Schema", () => {
		it("should have correct table name", () => {
			expect(getTableName(emailNotificationsTable)).toBe("email_notifications");
		});

		it("should have all 15 expected columns defined", () => {
			const columns = Object.entries(emailNotificationsTable)
				.filter(([, value]) => value && typeof value === "object" && "name" in value)
				.map(([key]) => key);
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
			expect(columns).toHaveLength(15);
		});

		it("should set expected column names, nullability, and defaults", () => {
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

			expect(emailNotificationsTable.sesMessageId.name).toBe("ses_message_id");
			expect(emailNotificationsTable.sesMessageId.notNull).toBe(false);
			expect(emailNotificationsTable.sesMessageId.hasDefault).toBe(false);

			expect(emailNotificationsTable.errorMessage.name).toBe("error_message");
			expect(emailNotificationsTable.errorMessage.notNull).toBe(false);
			expect(emailNotificationsTable.errorMessage.hasDefault).toBe(false);

			expect(emailNotificationsTable.retryCount.name).toBe("retry_count");
			expect(emailNotificationsTable.retryCount.notNull).toBe(true);
			expect(emailNotificationsTable.retryCount.hasDefault).toBe(true);

			expect(emailNotificationsTable.maxRetries.name).toBe("max_retries");
			expect(emailNotificationsTable.maxRetries.notNull).toBe(true);
			expect(emailNotificationsTable.maxRetries.hasDefault).toBe(true);

			expect(emailNotificationsTable.sentAt.name).toBe("sent_at");
			expect(emailNotificationsTable.sentAt.notNull).toBe(false);
			expect(emailNotificationsTable.sentAt.hasDefault).toBe(false);

			expect(emailNotificationsTable.failedAt.name).toBe("failed_at");
			expect(emailNotificationsTable.failedAt.notNull).toBe(false);
			expect(emailNotificationsTable.failedAt.hasDefault).toBe(false);

			expect(emailNotificationsTable.createdAt.name).toBe("created_at");
			expect(emailNotificationsTable.createdAt.notNull).toBe(true);
			expect(emailNotificationsTable.createdAt.hasDefault).toBe(true);

			expect(emailNotificationsTable.updatedAt.name).toBe("updated_at");
			expect(emailNotificationsTable.updatedAt.notNull).toBe(true);
			expect(emailNotificationsTable.updatedAt.hasDefault).toBe(true);
		});

		it("should expose status enum values", () => {
			expect(emailNotificationsTable.status.enumValues).toEqual([
				...STATUS_VALUES,
			]);
		});

		it("should have correct default values for status and retry counters", () => {
			expect(emailNotificationsTable.status.default).toBe("pending");
			expect(emailNotificationsTable.retryCount.default).toBe(0);
			expect(emailNotificationsTable.maxRetries.default).toBe(3);
		});

		it("should have id defaultFn and updatedAt onUpdateFn", () => {
			const idDefaultFn = emailNotificationsTable.id.defaultFn;
			expect(idDefaultFn).toBeDefined();
			if (typeof idDefaultFn === "function") {
				const generatedId = idDefaultFn();
				expect(typeof generatedId === "string" || generatedId).toBeTruthy();
				if (typeof generatedId === "string") {
					expect(generatedId.length).toBeGreaterThan(0);
				}
			}

			const onUpdateFn = emailNotificationsTable.updatedAt.onUpdateFn;
			expect(onUpdateFn).toBeDefined();
			if (typeof onUpdateFn === "function") {
				const beforeCall = new Date();
				const updatedAtValue = onUpdateFn();
				const afterCall = new Date();
				expect(updatedAtValue).toBeInstanceOf(Date);
				expect((updatedAtValue as Date).getTime()).toBeGreaterThanOrEqual(
					beforeCall.getTime(),
				);
				expect((updatedAtValue as Date).getTime()).toBeLessThanOrEqual(
					afterCall.getTime(),
				);
			}
		});
	});

	describe("Foreign Key Relationships", () => {
		const tableConfig = getTableConfig(emailNotificationsTable);
		const findForeignKeyByColumn = (columnName: string) =>
			tableConfig.foreignKeys.find(
				(fk: { reference: () => { columns: Array<{ name?: string }> } }) => {
					const ref = fk.reference();
					return ref.columns.some(
						(col: { name?: string }) => getColumnName(col) === columnName,
					);
				},
			);

		it("should have exactly 2 foreign keys defined", () => {
			expect(tableConfig.foreignKeys).toBeDefined();
			expect(Array.isArray(tableConfig.foreignKeys)).toBe(true);
			expect(tableConfig.foreignKeys.length).toBe(2);
		});

		it("should configure notificationLogId foreign key with cascade rules", () => {
			const notificationLogFk = findForeignKeyByColumn("notification_log_id");
			expect(notificationLogFk).toBeDefined();
			expect(notificationLogFk?.onDelete).toBe("cascade");
			expect(notificationLogFk?.onUpdate).toBe("cascade");
			const notificationRef = notificationLogFk?.reference();
			expect(notificationRef?.foreignTable).toBe(notificationLogsTable);
			expect(getColumnName(notificationRef?.foreignColumns[0])).toBe("id");
		});

		it("should configure userId foreign key with cascade rules", () => {
			const userFk = findForeignKeyByColumn("user_id");
			expect(userFk).toBeDefined();
			expect(userFk?.onDelete).toBe("cascade");
			expect(userFk?.onUpdate).toBe("cascade");
			const userRef = userFk?.reference();
			expect(userRef?.foreignTable).toBe(usersTable);
			expect(getColumnName(userRef?.foreignColumns[0])).toBe("id");
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
			) => { withFieldName: () => object };
		}

		let capturedRelations: Record<string, CapturedRelation> = {};

		beforeAll(() => {
			capturedRelations = {};
			(
				emailNotificationsTableRelations.config as unknown as (
					helpers: MockRelationHelpers,
				) => unknown
			)({
				one: (table: Table, config?: CapturedRelation["config"]) => {
					if (config?.relationName?.includes("notification_log_id")) {
						capturedRelations.notificationLog = { table, config };
					}
					if (config?.relationName?.includes("user_id")) {
						capturedRelations.user = { table, config };
					}
					return { withFieldName: () => ({}) };
				},
			});
		});

		it("should be defined and reference emailNotificationsTable", () => {
			expect(emailNotificationsTableRelations).toBeDefined();
			expect(emailNotificationsTableRelations.table).toBe(
				emailNotificationsTable,
			);
		});

		it("should have config function defined", () => {
			expect(typeof emailNotificationsTableRelations.config).toBe("function");
		});

		it("should define notificationLog relation", () => {
			expect(capturedRelations.notificationLog).toBeDefined();
			const relation = capturedRelations.notificationLog;
			expect(relation?.table).toBe(notificationLogsTable);
			expect(
				getColumnName(relation?.config?.fields?.[0] as { name?: string }),
			).toBe("notification_log_id");
			expect(
				getColumnName(relation?.config?.references?.[0] as { name?: string }),
			).toBe("id");
			expect(relation?.config?.relationName).toBe(
				"email_notifications.notification_log_id:notification_logs.id",
			);
		});

		it("should define user relation", () => {
			expect(capturedRelations.user).toBeDefined();
			const relation = capturedRelations.user;
			expect(relation?.table).toBe(usersTable);
			expect(
				getColumnName(relation?.config?.fields?.[0] as { name?: string }),
			).toBe("user_id");
			expect(
				getColumnName(relation?.config?.references?.[0] as { name?: string }),
			).toBe("id");
			expect(relation?.config?.relationName).toBe(
				"email_notifications.user_id:users.id",
			);
		});

		it("should define exactly two relations (notificationLog, user)", () => {
			expect(Object.keys(capturedRelations)).toHaveLength(2);
			expect(capturedRelations.notificationLog).toBeDefined();
			expect(capturedRelations.user).toBeDefined();
		});
	});

	describe("Insert Schema Validation", () => {
		const validInsertData = {
			notificationLogId: VALID_UUID,
			email: VALID_EMAIL,
			subject: VALID_SUBJECT,
			htmlBody: VALID_HTML_BODY,
		};

		it("should accept insert with only required fields", () => {
			const result =
				emailNotificationsTableInsertSchema.safeParse(validInsertData);
			expect(result.success).toBe(true);
		});

		it("should reject missing required fields (notificationLogId, email, subject, htmlBody)", () => {
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
			it("should accept email at max length (256 chars)", () => {
				const emailAtMaxLength = `${"a".repeat(64)}@${"b".repeat(187)}.com`;
				expect(emailAtMaxLength.length).toBe(256);
				expect(
					emailNotificationsTableInsertSchema.safeParse({
						...validInsertData,
						email: emailAtMaxLength,
					}).success,
				).toBe(true);
			});

			it("should reject email longer than 256 chars", () => {
				const emailTooLong = `${"a".repeat(64)}@${"b".repeat(188)}.com`;
				expect(emailTooLong.length).toBe(257);
				expect(
					emailNotificationsTableInsertSchema.safeParse({
						...validInsertData,
						email: emailTooLong,
					}).success,
				).toBe(false);
			});

			it("should reject invalid email format", () => {
				expect(
					emailNotificationsTableInsertSchema.safeParse({
						...validInsertData,
						email: "not-an-email",
					}).success,
				).toBe(false);
			});

			it("should reject empty email", () => {
				expect(
					emailNotificationsTableInsertSchema.safeParse({
						...validInsertData,
						email: "",
					}).success,
				).toBe(false);
			});
		});

		describe("subject field", () => {
			it("should accept subject length of 1 and 512 characters", () => {
				const minSubject = "a";
				expect(
					emailNotificationsTableInsertSchema.safeParse({
						...validInsertData,
						subject: minSubject,
					}).success,
				).toBe(true);

				const maxSubject = "a".repeat(512);
				expect(
					emailNotificationsTableInsertSchema.safeParse({
						...validInsertData,
						subject: maxSubject,
					}).success,
				).toBe(true);
			});

			it("should reject empty subject", () => {
				expect(
					emailNotificationsTableInsertSchema.safeParse({
						...validInsertData,
						subject: "",
					}).success,
				).toBe(false);
			});

			it("should reject subject longer than 512 characters", () => {
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
			it("should accept each allowed status value", () => {
				STATUS_VALUES.forEach((status) => {
					expect(
						emailNotificationsTableInsertSchema.safeParse({
							...validInsertData,
							status,
						}).success,
					).toBe(true);
				});
			});

			it("should reject unsupported status values", () => {
				expect(
					emailNotificationsTableInsertSchema.safeParse({
						...validInsertData,
						status: "unknown",
					}).success,
				).toBe(false);
			});
		});

		describe("userId field", () => {
			it("should accept valid UUID or null userId", () => {
				expect(
					emailNotificationsTableInsertSchema.safeParse({
						...validInsertData,
						userId: VALID_USER_UUID,
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

		it("should reject empty object or null input", () => {
			expect(emailNotificationsTableInsertSchema.safeParse({}).success).toBe(
				false,
			);
			expect(emailNotificationsTableInsertSchema.safeParse(null).success).toBe(
				false,
			);
		});
	});

	describe("Table Indexes", () => {
		const tableConfig = getTableConfig(emailNotificationsTable);

		it("should have exactly 4 indexes defined", () => {
			expect(tableConfig.indexes).toBeDefined();
			expect(Array.isArray(tableConfig.indexes)).toBe(true);
			expect(tableConfig.indexes.length).toBe(4);
		});

		it("should have indexes on key columns", () => {
			const indexedColumns = tableConfig.indexes.map(
				(idx) => idx.config.columns[0] && getColumnName(idx.config.columns[0]),
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
			expect(typeof emailNotificationsTableInsertSchema.parse).toBe("function");
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
			expect(emailNotificationsTable.sesMessageId.dataType).toBe("string");
			expect(emailNotificationsTable.errorMessage.dataType).toBe("string");
			expect(emailNotificationsTable.retryCount.dataType).toBe("number");
			expect(emailNotificationsTable.maxRetries.dataType).toBe("number");
			expect(emailNotificationsTable.createdAt.dataType).toBe("date");
			expect(emailNotificationsTable.updatedAt.dataType).toBe("date");
			expect(emailNotificationsTable.sentAt.dataType).toBe("date");
			expect(emailNotificationsTable.failedAt.dataType).toBe("date");
		});
	});
});
