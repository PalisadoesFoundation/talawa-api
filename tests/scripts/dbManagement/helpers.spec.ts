import { describe, it, expect, vi, beforeEach } from "vitest";
import * as helpers from "../../../scripts/dbManagement/helpers";

describe("Focused Seeder Logic Tests", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Recurrence Logic Hardening", () => {
		it("strips positional prefixes from RRULE string but preserves raw byDay", async () => {
			const insertSpy = vi.spyOn(helpers.db, "insert").mockReturnValue({
				values: vi.fn().mockReturnValue({
					onConflictDoUpdate: vi.fn().mockResolvedValue([]),
				}),
			} as any);

			await helpers.insertRecurrenceRules([
				{
					id: "r1",
					baseRecurringEventId: "e1",
					creatorId: "u1",
					organizationId: "o1",
					frequency: "WEEKLY",
					interval: 1,
					byDay: "+1MO",
				} as any,
			]);

			const callResult = insertSpy.mock.results[0];
			expect(callResult).toBeDefined();

			const insertReturn = callResult!.value as any;
			const valuesCall = insertReturn.values;
			const payload = valuesCall.mock.calls[0][0][0];

			expect(payload.recurrenceRuleString).toContain("BYDAY=MO");
			expect(payload.byDay).toContain("+1MO");
		});
	});

	describe("Utility Validation", () => {
		it("parseDate returns null for invalid inputs", () => {
			expect(helpers.parseDate([])).toBeNull();
			expect(helpers.parseDate("")).toBeNull();
		});
	});
});
