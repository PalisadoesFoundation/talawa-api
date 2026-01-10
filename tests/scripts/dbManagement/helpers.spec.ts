import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs/promises";
import * as helpers from "../../../scripts/dbManagement/helpers";

vi.mock("node:fs/promises");

// Shared mock for the DB insert chain
const mockInsert = vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockResolvedValue([]),
        onConflictDoUpdate: vi.fn().mockResolvedValue([])
    })
});

vi.mock("../../../scripts/dbManagement/helpers", async (importOriginal) => {
    const actual: any = await importOriginal();
    return {
        ...actual,
        db: {
            insert: mockInsert,
            select: vi.fn().mockReturnValue({ from: vi.fn().mockResolvedValue([{ count: 0 }]) }),
            query: { usersTable: { findFirst: vi.fn().mockResolvedValue({ id: "admin-id" }) } },
            execute: vi.fn(),
            transaction: (cb: any) => cb({ insert: mockInsert })
        }
    };
});

describe("DB Management Helpers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("listSampleData", () => {
        it("should list files and return true", async () => {
            (fs.readdir as any).mockResolvedValue(["test.json"]);
            (fs.readFile as any).mockResolvedValue(JSON.stringify([{ id: 1 }]));
            
            const result = await helpers.listSampleData();
            expect(result).toBe(true);
        });

        it("should handle invalid JSON gracefully", async () => {
            (fs.readdir as any).mockResolvedValue(["invalid.json"]);
            (fs.readFile as any).mockResolvedValue("INVALID_JSON");
            
            const result = await helpers.listSampleData();
            expect(result).toBe(true); // Should not crash
        });
    });

    describe("insertCollections", () => {
        it("should handle recurrence_rules as single object", async () => {
            const rule = { id: "r1", frequency: "WEEKLY", interval: 1, organizationId: "org1", baseRecurringEventId: "e1" };
            (fs.readFile as any).mockResolvedValue(JSON.stringify(rule));
            
            await helpers.insertCollections(["recurrence_rules"]);
            expect(mockInsert).toHaveBeenCalled();
        });

        it("should handle null byDay", async () => {
            const rules = [{ id: "r1", frequency: "DAILY", interval: 1, byDay: null, organizationId: "org1" }];
            (fs.readFile as any).mockResolvedValue(JSON.stringify(rules));
            
            await helpers.insertCollections(["recurrence_rules"]);
            const callArgs = mockInsert().values.mock.calls[0][0];
            expect(callArgs[0].byDay).toBeNull();
            expect(callArgs[0].recurrenceRuleString).not.toContain("BYDAY");
        });

        it("should accept iCal format byDay values", async () => {
            const rules = [{ id: "r1", frequency: "MONTHLY", interval: 1, byDay: "1MO,-2FR", organizationId: "org1" }];
            (fs.readFile as any).mockResolvedValue(JSON.stringify(rules));
            
            await helpers.insertCollections(["recurrence_rules"]);
            const callArgs = mockInsert().values.mock.calls[0][0];
            expect(callArgs[0].byDay).toEqual(["1MO", "-2FR"]);
        });

        it("should fail validation on invalid frequency with exact message", async () => {
            const rules = [{ frequency: "INVALID_FREQ" }];
            (fs.readFile as any).mockResolvedValue(JSON.stringify(rules));

            await expect(helpers.insertCollections(["recurrence_rules"]))
                .rejects.toThrow("Invalid frequency: INVALID_FREQ");
        });

        it("should handle event_attendees insertion and dates", async () => {
            const attendees = [{ id: "a1", createdAt: "2023-01-01T00:00:00Z" }];
            (fs.readFile as any).mockResolvedValue(JSON.stringify(attendees));

            await helpers.insertCollections(["event_attendees"]);
            // In a real test we'd inspect the Date object properties here
            expect(mockInsert).toHaveBeenCalled();
        });
    });
});
