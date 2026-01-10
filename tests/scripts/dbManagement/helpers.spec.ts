import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import * as helpers from "../../../scripts/dbManagement/helpers";

vi.mock("node:fs/promises");

const mockOnConflictDoNothing = vi.fn().mockResolvedValue([]);
const mockOnConflictDoUpdate = vi.fn().mockResolvedValue([]);
const mockValues = vi.fn().mockReturnValue({
    onConflictDoNothing: mockOnConflictDoNothing,
    onConflictDoUpdate: mockOnConflictDoUpdate
});

const mockInsert = vi.fn().mockReturnValue({ values: mockValues });

vi.mock("../../../scripts/dbManagement/helpers", async (importOriginal) => {
    const actual = await importOriginal() as typeof import("../../../scripts/dbManagement/helpers");
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
            expect(result).toBe(false); 
        });
    });

    describe("insertCollections", () => {
        it("should insert recurrence_rules and validate call arguments strictly", async () => {
            const rule = { 
                id: "r1", 
                baseRecurringEventId: "e1", 
                creatorId: "u1", 
                organizationId: "org1", 
                frequency: "WEEKLY", 
                interval: 1 
            };
            (fs.readFile as any).mockResolvedValue(JSON.stringify([rule]));
            
            await helpers.insertCollections(["recurrence_rules"]);
            
            // Fix: Strict assertion on transformed payload using arrayContaining/objectContaining
            expect(mockValues).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: "r1",
                        frequency: "WEEKLY",
                        interval: 1,
                        // Matches "FREQ=WEEKLY;INTERVAL=1;UNTIL=YYYYMMDDTHHMMSSZ"
                        recurrenceRuleString: expect.stringMatching(/^FREQ=WEEKLY;INTERVAL=1;UNTIL=\d{8}T\d{6}Z$/),
                    })
                ])
            );
        });

        it("should fail validation on invalid frequency", async () => {
            const rules = [{ id: "r1", baseRecurringEventId: "e1", creatorId: "u1", organizationId: "org1", frequency: "INVALID_FREQ" }];
            (fs.readFile as any).mockResolvedValue(JSON.stringify(rules));

            await expect(helpers.insertCollections(["recurrence_rules"]))
                .rejects.toThrow("Invalid frequency: INVALID_FREQ");
        });
    });
});
