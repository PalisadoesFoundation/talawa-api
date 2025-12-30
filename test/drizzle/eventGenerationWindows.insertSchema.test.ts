import { describe, expect, it } from "vitest";
import { eventGenerationWindowsTableInsertSchema } from "~/src/drizzle/tables/eventGenerationWindows";

describe("eventGenerationWindows insert schema numeric bounds", () => {
	const base = {
		organizationId: "3f738d7f-22e7-4bda-b47f-61f0a9c9c9a1",
		currentWindowEndDate: new Date(),
		retentionStartDate: new Date(),
	};

	it("hotWindowMonthsAhead min/max", () => {
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				hotWindowMonthsAhead: 1,
			}).success,
		).toBe(true);
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				hotWindowMonthsAhead: 60,
			}).success,
		).toBe(true);
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				hotWindowMonthsAhead: 0,
			}).success,
		).toBe(false);
		expect(
			eventGenerationWindowsTableInsertSchema.safeParse({
				...base,
				hotWindowMonthsAhead: 61,
			}).success,
		).toBe(false);
	});
});
