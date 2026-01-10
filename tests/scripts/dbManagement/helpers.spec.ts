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
            select: vi.fn().mockReturnValue({ from: vi.fn().mockResolvedValue([{ count: 5 }]) }),
            query: { usersTable: { findFirst: vi.fn().mockResolvedValue({ id: "admin-id" }) } },
            execute: vi.fn(),
            transaction: (cb: any) => {
                const tx = { 
                    insert: mockInsert, 
                    execute: vi.fn().mockResolvedValue([{ tablename: "some_table" }]), 
                    rollback: vi.fn() 
                };
                return cb(tx);
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
        it("should return Date for valid ISO string", () => {
            expect(helpers.parseDate("2025-01-01T00:00:00Z")).toBeInstanceOf(Date);
        });
        it("should return null for invalid inputs", () => {
            expect(helpers.parseDate("not-a-date")).toBeNull();
            expect(helpers.parseDate(null)).toBeNull();
            expect(helpers.parseDate(undefined)).toBeNull();
        });
        it("should handle numeric timestamps", () => {
            const now = Date.now();
            expect(helpers.parseDate(now)?.getTime()).toBe(now);
        });
    });

    describe("listSampleData", () => {
        it("should return true for valid array JSON", async () => {
            (fs.readdir as any).mockResolvedValue(["test.json"]);
            (fs.readFile as any).mockResolvedValue(JSON.stringify([{ id: 1 }]));
            expect(await helpers.listSampleData(true)).toBe(true);
        });
        it("should return false for malformed files", async () => {
            (fs.readdir as any).mockResolvedValue(["bad.json"]);
            (fs.readFile as any).mockResolvedValue("INVALID");
            expect(await helpers.listSampleData(true)).toBe(false);
        });
    });

    describe("insertCollections Logic", () => {
        it("should fail strictly on missing required files", async () => {
            (fs.readFile as any).mockRejectedValue(new Error("ENOENT"));
            await expect(helpers.insertCollections(["users"], false))
                .rejects.toThrow("Failed to read required file");
        });

        it("should process recurrence rules with transformed data", async () => {
            const rule = { 
                id: "r1", baseRecurringEventId: "e1", creatorId: "u1", organizationId: "org1", 
                frequency: "WEEKLY", interval: 1 
            };
            (fs.readFile as any).mockResolvedValue(JSON.stringify([rule]));
            await helpers.insertCollections(["recurrence_rules"], false);
            
            expect(mockValues).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: "r1",
                        frequency: "WEEKLY",
                        recurrenceRuleString: expect.stringContaining("FREQ=WEEKLY"),
                    })
                ])
            );
        });
    });

    describe("Maintenance Tasks", () => {
        it("formatDatabase should execute without error", async () => {
            expect(await helpers.formatDatabase()).toBe(true);
        });
        it("emptyMinioBucket should handle stream iterator", async () => {
            expect(await helpers.emptyMinioBucket()).toBe(true);
        });
        it("checkDataSize should query and return true", async () => {
            expect(await helpers.checkDataSize("Test")).toBe(true);
        });
    });
});
