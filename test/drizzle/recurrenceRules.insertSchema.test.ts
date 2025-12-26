import { describe, it, expect } from "vitest";
import { recurrenceRulesTableInsertSchema } from "~/src/drizzle/tables/recurrenceRules";

describe("recurrenceRules insert schema refine() rules", () => {
	const base = {
		recurrenceRuleString: "RRULE:FREQ=WEEKLY",
		frequency: "WEEKLY",
		interval: 1,
		latestInstanceDate: new Date(),
		recurrenceStartDate: new Date(),
		baseRecurringEventId: "9e6a7c6e-2b1b-4f47-9d36-7f3d0a0a1a11",
		organizationId: "3f738d7f-22e7-4bda-b47f-61f0a9c9c9a1",
		creatorId: "f9b8a167-7de1-4ba4-8b72-8f8c76b0f5b0",
	};

	it("accepts undefined/null for byDay/byMonth/byMonthDay", () => {
		const ok1 = recurrenceRulesTableInsertSchema.safeParse({
			...base,
			byDay: undefined,
		});
		const ok2 = recurrenceRulesTableInsertSchema.safeParse({
			...base,
			byMonth: null,
		});
		const ok3 = recurrenceRulesTableInsertSchema.safeParse({
			...base,
			byMonthDay: undefined,
		});
		expect(ok1.success && ok2.success && ok3.success).toBe(true);
	});

	it("enforces byDay elements length 2–3", () => {
		expect(
			recurrenceRulesTableInsertSchema.safeParse({
				...base,
				byDay: ["MO", "WE"],
			}).success,
		).toBe(true);
		expect(
			recurrenceRulesTableInsertSchema.safeParse({ ...base, byDay: ["MON"] })
				.success,
		).toBe(true);
		expect(
			recurrenceRulesTableInsertSchema.safeParse({ ...base, byDay: ["M"] })
				.success,
		).toBe(false);
		expect(
			recurrenceRulesTableInsertSchema.safeParse({ ...base, byDay: ["MONDAY"] })
				.success,
		).toBe(false);
	});

	it("enforces byMonth elements 1–12", () => {
		expect(
			recurrenceRulesTableInsertSchema.safeParse({
				...base,
				byMonth: [1, 6, 12],
			}).success,
		).toBe(true);
		expect(
			recurrenceRulesTableInsertSchema.safeParse({ ...base, byMonth: [0] })
				.success,
		).toBe(false);
		expect(
			recurrenceRulesTableInsertSchema.safeParse({ ...base, byMonth: [13] })
				.success,
		).toBe(false);
	});

	it("enforces byMonthDay elements -31..31 excluding 0", () => {
		expect(
			recurrenceRulesTableInsertSchema.safeParse({
				...base,
				byMonthDay: [1, 15, -1],
			}).success,
		).toBe(true);
		expect(
			recurrenceRulesTableInsertSchema.safeParse({ ...base, byMonthDay: [0] })
				.success,
		).toBe(false);
		expect(
			recurrenceRulesTableInsertSchema.safeParse({ ...base, byMonthDay: [-32] })
				.success,
		).toBe(false);
		expect(
			recurrenceRulesTableInsertSchema.safeParse({ ...base, byMonthDay: [32] })
				.success,
		).toBe(false);
	});
});
