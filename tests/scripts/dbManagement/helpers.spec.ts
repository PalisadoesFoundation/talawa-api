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
                return cb(tx);
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

    describe("validateSampleData", () => {
        it("should return false for non-array JSON", async () => {
            (fs.readdir as any).mockResolvedValue(["test.json"]);
            (fs.readFile as any).mockResolvedValue(JSON.stringify({ not: "an-array" }));
            expect(await helpers.validateSampleData(true)).toBe(false);
        });
        it("should return true for valid array JSON", async () => {
            (fs.readdir as any).mockResolvedValue(["test.json"]);
            (fs.readFile as any).mockResolvedValue(JSON.stringify([{ id: 1 }]));
            expect(await helpers.validateSampleData(true)).toBe(true);
        });
    });

    describe("insertCollections Handlers", () => {
        it("should insert recurrence rules strictly and deterministic", async () => {
            const rule = { id: "r1", baseRecurringEventId: "e1", creatorId: "u1", organizationId: "org1", frequency: "WEEKLY", interval: 1 };
            (fs.readFile as any).mockResolvedValue(JSON.stringify([rule]));
            await helpers.insertCollections(["recurrence_rules"], false);
            expect(mockValues).toHaveBeenCalledWith(expect.arrayContaining([expect.objectContaining({ id: "r1" })]));
        });

        it("should fail strictly on missing required files", async () => {
            (fs.readFile as any).mockRejectedValue(new Error("ENOENT"));
            await expect(helpers.insertCollections(["users"], false)).rejects.toThrow("Failed to load required collection");
        });
    });

    describe("Maintenance Operations", () => {
        it("formatDatabase should complete successfully", async () => {
            expect(await helpers.formatDatabase()).toBe(true);
        });
        it("emptyMinioBucket should complete successfully", async () => {
            expect(await helpers.emptyMinioBucket()).toBe(true);
        });
    });
});
