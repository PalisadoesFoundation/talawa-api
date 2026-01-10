import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs/promises";
import * as helpers from "../../../scripts/dbManagement/helpers";

vi.mock("node:fs/promises");

const mockValues = vi.fn().mockReturnValue({
    onConflictDoNothing: vi.fn().mockResolvedValue([]),
    onConflictDoUpdate: vi.fn().mockResolvedValue([])
});

const mockInsert = vi.fn().mockReturnValue({ values: mockValues });

vi.mock("../../../scripts/dbManagement/helpers", async (importOriginal) => {
    const actual = await importOriginal() as typeof helpers;
    return {
        ...actual,
        db: {
            insert: mockInsert,
            select: vi.fn().mockReturnValue({ from: vi.fn().mockResolvedValue([{ count: 5 }]) }),
            query: { usersTable: { findFirst: vi.fn().mockResolvedValue({ id: "admin-id" }) } },
            execute: vi.fn().mockResolvedValue([{ tablename: "t1" }]),
            transaction: (cb: any) => {
                const tx = { insert: mockInsert, execute: vi.fn().mockResolvedValue([{ tablename: "t1" }]), rollback: vi.fn() };
                try {
                    const result = cb(tx);
                    return result instanceof Promise ? result : Promise.resolve(result);
                } catch (e) {
                    tx.rollback();
                    throw e;
                }
            }
        },
        minioClient: {
            listObjects: vi.fn().mockReturnValue({ [Symbol.asyncIterator]: async function* () { yield { name: "o1" }; } }),
            removeObjects: vi.fn().mockResolvedValue(true)
        }
    };
});

describe("DB Management Helpers", () => {
    beforeEach(() => { vi.clearAllMocks(); });

    describe("parseDate", () => {
        it("should parse various formats", () => {
            expect(helpers.parseDate("2025-01-01T00:00:00Z")).toBeInstanceOf(Date);
            expect(helpers.parseDate(1704067200000)).toBeInstanceOf(Date);
            expect(helpers.parseDate(null)).toBeNull();
        });
    });

    describe("validateSampleData", () => {
        it("should return false for objects instead of arrays", async () => {
            (fs.readdir as any).mockResolvedValue(["test.json"]);
            (fs.readFile as any).mockResolvedValue(JSON.stringify({ key: "val" }));
            expect(await helpers.validateSampleData(true)).toBe(false);
        });
    });

    describe("insertRecurrenceRules Validation", () => {
        it("should throw for invalid byDay codes", async () => {
            const rule = { id: "r1", baseRecurringEventId: "e1", creatorId: "u1", organizationId: "org1", frequency: "WEEKLY", interval: 1, byDay: "ABC" };
            (fs.readFile as any).mockResolvedValue(JSON.stringify([rule]));
            await expect(helpers.insertCollections(["recurrence_rules"], false)).rejects.toThrow("Invalid byDay value: ABC");
        });

        it("should throw for non-integer intervals", async () => {
            const rule = { id: "r1", baseRecurringEventId: "e1", creatorId: "u1", organizationId: "org1", frequency: "WEEKLY", interval: 1.5 };
            (fs.readFile as any).mockResolvedValue(JSON.stringify([rule]));
            await expect(helpers.insertCollections(["recurrence_rules"], false)).rejects.toThrow("Invalid interval");
        });
    });

    describe("Error Handling & Transactions", () => {
        it("should fail strictly on missing required files", async () => {
            (fs.readFile as any).mockRejectedValue(new Error("ENOENT"));
            await expect(helpers.insertCollections(["users"], false)).rejects.toThrow("Failed to load users");
        });
    });

    describe("Maintenance Tasks", () => {
        it("checkDataSize should complete successfully", async () => {
            expect(await helpers.checkDataSize("Test")).toBe(true);
        });
        it("emptyMinioBucket should handle stream iterator", async () => {
            expect(await helpers.emptyMinioBucket()).toBe(true);
        });
        it("pingDB should return true on success", async () => {
            expect(await helpers.pingDB()).toBe(true);
        });
    });
});
