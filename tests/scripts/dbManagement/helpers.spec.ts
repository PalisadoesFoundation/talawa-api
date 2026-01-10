import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import * as helpers from "../../../scripts/dbManagement/helpers";

vi.mock("node:fs/promises");

// Fix: Define mock return values upfront to avoid re-invocation issues
const mockOnConflictDoNothing = vi.fn().mockResolvedValue([]);
const mockOnConflictDoUpdate = vi.fn().mockResolvedValue([]);
const mockValues = vi.fn().mockReturnValue({
    onConflictDoNothing: mockOnConflictDoNothing,
    onConflictDoUpdate: mockOnConflictDoUpdate
});

// The insert mock returns an object that has a 'values' property pointing to our spy
const mockInsert = vi.fn().mockReturnValue({ values: mockValues });

vi.mock("../../../scripts/dbManagement/helpers", async (importOriginal) => {
    const actual: any = await importOriginal();
    return {
        ...actual,
        db: {
            insert: mockInsert,
            select: vi.fn().mockReturnValue({ from: vi.fn().mockResolvedValue([{ count: 0 }]) }),
            query: { usersTable: { findFirst: vi.fn().mockResolvedValue({ id: "admin-id" }) } },
            execute: vi.fn(),
            transaction: (cb: any) => cb({ insert: mockInsert, execute: vi.fn() })
        },
        minioClient: {
            listObjects: vi.fn(),
            removeObjects: vi.fn()
        }
    };
});

describe("DB Management Helpers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("listSampleData", () => {
        it("should handle mixed file types and return true", async () => {
            (fs.readdir as any).mockResolvedValue(["test.json", "readme.txt"]);
            (fs.readFile as any).mockResolvedValue(JSON.stringify([{ id: 1 }]));
            
            const result = await helpers.listSampleData();
            expect(result).toBe(true);
            expect(fs.readFile).toHaveBeenCalledTimes(1); 
        });

        it("should handle invalid JSON gracefully", async () => {
            (fs.readdir as any).mockResolvedValue(["invalid.json"]);
            (fs.readFile as any).mockResolvedValue("INVALID_JSON");
            
            const result = await helpers.listSampleData();
            expect(result).toBe(true);
        });
    });

    describe("insertCollections", () => {
        it("should insert recurrence_rules and validate call arguments", async () => {
            const rule = { id: "r1", frequency: "WEEKLY", interval: 1, organizationId: "org1", baseRecurringEventId: "e1" };
            (fs.readFile as any).mockResolvedValue(JSON.stringify([rule]));
            
            await helpers.insertCollections(["recurrence_rules"]);
            
            // Fix: Assert against the captured spy, not a new call
            expect(mockValues).toHaveBeenCalled();
            const callArgs = mockValues.mock.calls[0][0];
            expect(callArgs[0].frequency).toBe("WEEKLY");
        });

        it("should fail validation on invalid frequency with exact message", async () => {
            const rules = [{ frequency: "INVALID_FREQ" }];
            (fs.readFile as any).mockResolvedValue(JSON.stringify(rules));

            await expect(helpers.insertCollections(["recurrence_rules"]))
                .rejects.toThrow("Invalid frequency: INVALID_FREQ");
        });

        it("should verify event_attendees date parsing", async () => {
            const attendees = [{ id: "a1", createdAt: "2023-01-01T00:00:00Z" }];
            (fs.readFile as any).mockResolvedValue(JSON.stringify(attendees));

            await helpers.insertCollections(["event_attendees"]);
            
            const callArgs = mockValues.mock.calls[0][0];
            expect(callArgs[0].createdAt).toBeInstanceOf(Date);
            expect(callArgs[0].createdAt.toISOString()).toBe("2023-01-01T00:00:00.000Z");
        });
    });
});
