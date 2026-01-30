import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";
import {
	notificationLogsTable,
	notificationLogsTableInsertSchema,
	notificationLogsTableRelations,
} from "../../../src/drizzle/tables/NotificationLog";

describe("src/drizzle/tables/NotificationLog.ts - Table Definition Tests", () => {
	describe("Table Schema", () => {
		it("should have the correct table name", () => {
			const config = getTableConfig(notificationLogsTable);
			expect(config.name).toBe("notification_logs");
		});

		it("should have all expected columns", () => {
			const columns = Object.keys(notificationLogsTable);
			expect(columns).toContain("id");
			expect(columns).toContain("templateId");
			expect(columns).toContain("status");
			expect(columns).toContain("eventType");
		});
	});

	describe("Table Relations", () => {
		it("should be defined", () => {
			expect(notificationLogsTableRelations).toBeDefined();
		});

		it("should execute relations for 100% coverage", () => {
			const mockRelation = {
				withFieldName: vi.fn().mockReturnThis(),
			};

			const mockOne = vi.fn().mockReturnValue(mockRelation);
			const mockMany = vi.fn().mockReturnValue(mockRelation);

			// We use specific function signatures () => unknown
			// to avoid the 'Function' banned type error.
			const relationsFunc = (
				notificationLogsTableRelations as unknown as {
					config: (helpers: {
						one: (...args: unknown[]) => unknown;
						many: (...args: unknown[]) => unknown;
					}) => void;
				}
			).config;

			relationsFunc({ one: mockOne, many: mockMany });

			expect(mockOne).toHaveBeenCalled();
			expect(mockMany).toHaveBeenCalled();
		});
	});

	describe("Insert Schema Validation", () => {
		it("should validate correctly", () => {
			const validData = {
				templateId: "00000000-0000-0000-0000-000000000000",
				eventType: "TEST",
				channel: "EMAIL",
			};
			const result = notificationLogsTableInsertSchema.safeParse(validData);
			expect(result.success).toBe(true);
		});

    
		it("should fail on invalid data", () => {
			const result = notificationLogsTableInsertSchema.safeParse({});
			expect(result.success).toBe(false);
		});
	});
});
