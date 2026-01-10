import fs from "node:fs/promises";
import path from "node:path";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as helpers from "../../../scripts/dbManagement/helpers";

// Mock FS
vi.mock("node:fs/promises");

// Mock Postgres/Drizzle
const mockExecute = vi.fn();
const mockInsert = vi.fn().mockReturnThis();
const mockValues = vi.fn().mockReturnThis();
const mockOnConflictDoUpdate = vi.fn().mockResolvedValue([]);
const mockOnConflictDoNothing = vi.fn().mockResolvedValue([]);
const mockFrom = vi.fn().mockResolvedValue([{ count: 5 }]);
const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

vi.mock("src/drizzle/schema", () => ({
    usersTable: { id: "id" },
    organizationsTable: { id: "id" },
    organizationMembershipsTable: { id: "id" },
    eventsTable: { id: "id" },
    recurrenceRulesTable: { id: "id" },
    eventAttendeesTable: { id: "id" }
}));

// Mock the DB client exported by helpers
vi.mock("../../../scripts/dbManagement/helpers", async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        db: {
            transaction: (cb: any) => cb({ execute: mockExecute, insert: mockInsert }),
            execute: mockExecute,
            insert: () => ({ values: mockValues }),
            select: mockSelect,
            query: {
                usersTable: {
                    findFirst: vi.fn().mockResolvedValue({ id: "admin-id" })
                }
            }
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
        mockValues.mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate, onConflictDoNothing: mockOnConflictDoNothing });
    });

    describe("listSampleData", () => {
        it("should list files and return true", async () => {
            (fs.readdir as any).mockResolvedValue(["test.json"]);
            (fs.readFile as any).mockResolvedValue(JSON.stringify([{ id: 1 }]));
            
            const result = await helpers.listSampleData();
            expect(result).toBe(true);
            expect(fs.readdir).toHaveBeenCalled();
        });

        it("should handle directory errors", async () => {
            (fs.readdir as any).mockRejectedValue(new Error("Dir not found"));
            const result = await helpers.listSampleData();
            expect(result).toBe(false);
        });
    });

    describe("insertCollections", () => {
        it("should insert recurrence_rules with dynamic data", async () => {
            const rules = [{
                id: "r1",
                frequency: "DYNAMIC",
                interval: "DYNAMIC",
                byDay: "MO,TU",
                organizationId: "org1"
            }];
            (fs.readFile as any).mockResolvedValue(JSON.stringify(rules));

            await helpers.insertCollections(["recurrence_rules"]);

            expect(mockValues).toHaveBeenCalled();
            const callArgs = mockValues.mock.calls[0][0];
            expect(callArgs[0].frequency).toBe("WEEKLY");
            expect(callArgs[0].byDay).toEqual(["MO", "TU"]);
            expect(callArgs[0].recurrenceRuleString).toContain("BYDAY=MO,TU");
        });

        it("should fail validation on invalid frequency", async () => {
            const rules = [{ frequency: "INVALID" }];
            (fs.readFile as any).mockResolvedValue(JSON.stringify(rules));

            await expect(helpers.insertCollections(["recurrence_rules"]))
                .rejects.toThrow("Invalid frequency");
        });

        it("should handle event_attendees insertion", async () => {
            const attendees = [{ id: "a1", createdAt: "2023-01-01" }];
            (fs.readFile as any).mockResolvedValue(JSON.stringify(attendees));

            await helpers.insertCollections(["event_attendees"]);
            expect(mockValues).toHaveBeenCalled();
        });
    });

    describe("checkDataSize", () => {
        it("should return true and log counts", async () => {
            const result = await helpers.checkDataSize("Test");
            expect(result).toBe(true);
            expect(mockSelect).toHaveBeenCalledTimes(4); // 4 tables checked
        });
    });
});
