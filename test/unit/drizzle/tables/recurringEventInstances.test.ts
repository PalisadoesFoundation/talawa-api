import { getTableColumns, getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
	recurringEventInstancesTable,
	recurringEventInstancesTableInsertSchema,
	recurringEventInstancesTableRelations,
} from "../../../../src/drizzle/tables/recurringEventInstances";

/**
 * IMPORTANT:
 * - These tests are PURE metadata tests
 * - No DB, no Fastify, no Redis
 * - We only inspect Drizzle table definitions
 */

describe("recurringEventInstancesTable definition", () => {
	it("should have the correct table name", () => {
		expect(getTableName(recurringEventInstancesTable)).toBe(
			"recurring_event_instances",
		);
	});

	it("should define all expected columns", () => {
		const columns = getTableColumns(recurringEventInstancesTable);

		expect(columns.id).toBeDefined();
		expect(columns.baseRecurringEventId).toBeDefined();
		expect(columns.recurrenceRuleId).toBeDefined();
		expect(columns.originalSeriesId).toBeDefined();
		expect(columns.originalInstanceStartTime).toBeDefined();
		expect(columns.actualStartTime).toBeDefined();
		expect(columns.actualEndTime).toBeDefined();
		expect(columns.isCancelled).toBeDefined();
		expect(columns.organizationId).toBeDefined();
		expect(columns.generatedAt).toBeDefined();
		expect(columns.lastUpdatedAt).toBeDefined();
		expect(columns.version).toBeDefined();
		expect(columns.sequenceNumber).toBeDefined();
		expect(columns.totalCount).toBeDefined();
	});

	it("should mark required columns as not null", () => {
		const columns = getTableColumns(recurringEventInstancesTable);

		expect(columns.id.notNull).toBe(true);
		expect(columns.baseRecurringEventId.notNull).toBe(true);
		expect(columns.recurrenceRuleId.notNull).toBe(true);
		expect(columns.originalSeriesId.notNull).toBe(true);
		expect(columns.originalInstanceStartTime.notNull).toBe(true);
		expect(columns.actualStartTime.notNull).toBe(true);
		expect(columns.actualEndTime.notNull).toBe(true);
		expect(columns.isCancelled.notNull).toBe(true);
		expect(columns.organizationId.notNull).toBe(true);
		expect(columns.generatedAt.notNull).toBe(true);
		expect(columns.sequenceNumber.notNull).toBe(true);
		expect(columns.version.notNull).toBe(true);
	});

	it("should configure default values correctly", () => {
		const columns = getTableColumns(recurringEventInstancesTable);

		expect(columns.isCancelled.default).toBeDefined();
		expect(columns.version.default).toBeDefined();
		expect(columns.generatedAt.default).toBeDefined();
	});
});

describe("recurringEventInstancesTable relations", () => {
	it("should export a relations object", () => {
		expect(recurringEventInstancesTableRelations).toBeDefined();
		expect(typeof recurringEventInstancesTableRelations).toBe("object");
	});
});

describe("recurringEventInstancesTableInsertSchema", () => {
	it("should be a valid Zod schema", () => {
		expect(recurringEventInstancesTableInsertSchema).toBeInstanceOf(
			z.ZodObject,
		);
	});

	it("should validate a minimal valid payload", () => {
		const validPayload = {
			baseRecurringEventId: crypto.randomUUID(),
			recurrenceRuleId: crypto.randomUUID(),
			originalSeriesId: crypto.randomUUID(),
			originalInstanceStartTime: new Date(),
			actualStartTime: new Date(),
			actualEndTime: new Date(),
			organizationId: crypto.randomUUID(),
			sequenceNumber: 1,
		};

		const result =
			recurringEventInstancesTableInsertSchema.safeParse(validPayload);

		expect(result.success).toBe(true);
	});

	it("should allow optional and nullable fields", () => {
		const payload = {
			baseRecurringEventId: crypto.randomUUID(),
			recurrenceRuleId: crypto.randomUUID(),
			originalSeriesId: crypto.randomUUID(),
			originalInstanceStartTime: new Date(),
			actualStartTime: new Date(),
			actualEndTime: new Date(),
			organizationId: crypto.randomUUID(),
			sequenceNumber: 1,
			isCancelled: true,
			totalCount: null,
			version: "2",
		};

		const result = recurringEventInstancesTableInsertSchema.safeParse(payload);

		expect(result.success).toBe(true);
	});

	it("should reject payload with invalid sequenceNumber (min constraint)", () => {
		const invalidPayload = {
			baseRecurringEventId: crypto.randomUUID(),
			recurrenceRuleId: crypto.randomUUID(),
			originalSeriesId: crypto.randomUUID(),
			originalInstanceStartTime: new Date(),
			actualStartTime: new Date(),
			actualEndTime: new Date(),
			organizationId: crypto.randomUUID(),
			sequenceNumber: 0,
		};

		const result =
			recurringEventInstancesTableInsertSchema.safeParse(invalidPayload);

		expect(result.success).toBe(false);

		if (!result.success) {
			const issue = result.error.issues.find(
				(i) => i.path[0] === "sequenceNumber",
			);

			expect(issue).toBeDefined();
			expect(issue?.code).toBe("too_small");
		}
	});

	it("should reject payload with invalid totalCount (min constraint)", () => {
		const invalidPayload = {
			baseRecurringEventId: crypto.randomUUID(),
			recurrenceRuleId: crypto.randomUUID(),
			originalSeriesId: crypto.randomUUID(),
			originalInstanceStartTime: new Date(),
			actualStartTime: new Date(),
			actualEndTime: new Date(),
			organizationId: crypto.randomUUID(),
			sequenceNumber: 1,
			totalCount: 0,
		};

		const result =
			recurringEventInstancesTableInsertSchema.safeParse(invalidPayload);

		expect(result.success).toBe(false);

		if (!result.success) {
			const issue = result.error.issues.find((i) => i.path[0] === "totalCount");

			expect(issue).toBeDefined();
			expect(issue?.code).toBe("too_small");
		}
	});
});
