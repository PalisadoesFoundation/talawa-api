import { describe, it, expect, vi, beforeEach } from "vitest";
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
            transaction: (cb: any) => {
                const tx = { insert: mockInsert, execute: vi.fn(), rollback: vi.fn() };
                try {
                    return cb(tx);
                } catch (e) {
                    tx.rollback();
                    throw e;
                }
            }
        },
        minioClient: {
            listObjects: vi.fn().mockReturnValue({
                [Symbol.asyncIterator]: async function* () {
                    yield { name: "test-obj" };
                }
            }),
            removeObjects: vi.fn().mockResolvedValue(true)
        }
    };
});

describe("DB Management Helpers", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("parseDate", () => {
        it("should return Date for valid input", () => {
            expect(helpers.parseDate("2025-01-01")).toBeInstanceOf(Date);
        });
        it("should return null for invalid strings", () => {
            expect(helpers.parseDate("invalid")).toBeNull();
        });
        it("should return null for null/undefined", () => {
            expect(helpers.parseDate(null)).toBeNull();
            expect(helpers.parseDate(undefined)).toBeNull();
        });
    });

    describe("listSampleData", () => {
        it("should list files quietly and return true", async () => {
            (fs.readdir as any).mockResolvedValue(["test.json"]);
            (fs.readFile as any).mockResolvedValue(JSON.stringify([{ id: 1 }]));
            const result = await helpers.listSampleData(true);
            expect(result).toBe(true);
        });

        it("should return false for malformed files", async () => {
            (fs.readdir as any).mockResolvedValue(["bad.json"]);
            (fs.readFile as any).mockResolvedValue("INVALID");
            const result = await helpers.listSampleData(true);
            expect(result).toBe(false);
        });
    });

    describe("insertCollections", () => {
        it("should insert recurrence_rules strictly and deterministic", async () => {
            const rule = { 
                id: "r1", 
                baseRecurringEventId: "e1", 
                creatorId: "u1", 
                organizationId: "org1", 
                frequency: "WEEKLY", 
                interval: 1 
            };
            (fs.readFile as any).mockResolvedValue(JSON.stringify([rule]));
            
            await helpers.insertCollections(["recurrence_rules"], false);
            
            expect(mockValues).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: "r1",
                        frequency: "WEEKLY",
                        recurrenceRuleString: expect.stringMatching(/^FREQ=WEEKLY;INTERVAL=1;UNTIL=\d{8}T\d{6}Z$/),
                    })
                ])
            );
        });

        it("should throw for missing required fields", async () => {
            const badRule = { id: "r1" }; // Missing baseRecurringEventId
            (fs.readFile as any).mockResolvedValue(JSON.stringify([badRule]));
            await expect(helpers.insertCollections(["recurrence_rules"], false))
                .rejects.toThrow("Missing required field");
        });
    });

    describe("Maintenance Operations", () => {
        it("checkDataSize should complete successfully", async () => {
            const result = await helpers.checkDataSize("Test");
            expect(result).toBe(true);
        });

        it("emptyMinioBucket should handle streaming deletes", async () => {
            const result = await helpers.emptyMinioBucket();
            expect(result).toBe(true);
        });
    });
});
