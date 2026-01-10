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

// Fix: Proper typing for imported module
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
            expect(result).toBe(false); // Should return false per strict rules
        });
    });

    describe("insertCollections", () => {
        it("should validate required fields in recurrence rules", async () => {
            // Missing creatorId
            const rule = { id: "r1", baseRecurringEventId: "e1", organizationId: "org1", frequency: "WEEKLY" };
            (fs.readFile as any).mockResolvedValue(JSON.stringify([rule]));
            
            await expect(helpers.insertCollections(["recurrence_rules"]))
                .rejects.toThrow("Missing required field");
        });

        it("should insert recurrence_rules with all required fields", async () => {
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
            expect(mockValues).toHaveBeenCalled();
        });

        it("should fail validation on invalid frequency with exact message", async () => {
            const rules = [{ id: "r1", baseRecurringEventId: "e1", creatorId: "u1", organizationId: "org1", frequency: "INVALID_FREQ" }];
            (fs.readFile as any).mockResolvedValue(JSON.stringify(rules));

            await expect(helpers.insertCollections(["recurrence_rules"]))
                .rejects.toThrow("Invalid frequency: INVALID_FREQ");
        });
    });
});
