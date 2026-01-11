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

describe("DB Management Helpers Hardened", () => {
    beforeEach(() => { vi.clearAllMocks(); });

    describe("parseDate Edge Cases", () => {
        it("should return null for invalid inputs", () => {
            expect(helpers.parseDate(undefined)).toBeNull();
            expect(helpers.parseDate("not-a-date")).toBeNull();
            expect(helpers.parseDate("")).toBeNull();
            expect(helpers.parseDate({})).toBeNull();
        });
        it("should handle valid ISO strings", () => {
            expect(helpers.parseDate("2025-01-01T00:00:00Z")).toBeInstanceOf(Date);
        });
    });

    describe("validateSampleData", () => {
        it("should return false for malformed files", async () => {
            (fs.readdir as any).mockResolvedValue(["a.json"]);
            (fs.readFile as any).mockResolvedValue("INVALID_JSON");
            expect(await helpers.validateSampleData(true)).toBe(false);
        });
        it("should handle directory errors", async () => {
            (fs.readdir as any).mockRejectedValue(new Error("ENOENT"));
            expect(await helpers.validateSampleData(true)).toBe(false);
        });
    });

    describe("Failure Path Testing", () => {
        it("pingDB should return false on database rejection", async () => {
            // Mocking the getter of 'db' to return a rejecting execute
            vi.spyOn(helpers.db, 'execute').mockRejectedValueOnce(new Error("Database connection refused"));
            expect(await helpers.pingDB()).toBe(false);
        });

        it("checkDataSize should return false on query failure", async () => {
            vi.spyOn(helpers.db, 'select').mockImplementationOnce(() => {
                throw new Error("Select failed");
            });
            expect(await helpers.checkDataSize("Test")).toBe(false);
        });
    });

    describe("Maintenance Logic", () => {
        it("formatDatabase should succeed under normal conditions", async () => {
            expect(await helpers.formatDatabase()).toBe(true);
        });
        it("emptyMinioBucket should handle batching without error", async () => {
            expect(await helpers.emptyMinioBucket()).toBe(true);
        });
    });
});
