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
        it("should return false if invalid JSON found", async () => {
            (fs.readdir as any).mockResolvedValue(["invalid.json"]);
            (fs.readFile as any).mockResolvedValue("INVALID");
            
            const result = await helpers.listSampleData();
            expect(result).toBe(false);
        });
    });

    describe("insertCollections", () => {
        it("should throw error for invalid required collection", async () => {
            (fs.readFile as any).mockResolvedValue("INVALID");
            await expect(helpers.insertCollections(["users"]))
                .rejects.toThrow("Malformed JSON");
        });

        it("should insert recurrence_rules and validate call arguments", async () => {
            const rule = { id: "r1", frequency: "WEEKLY", interval: 1, organizationId: "org1", baseRecurringEventId: "e1" };
            (fs.readFile as any).mockResolvedValue(JSON.stringify([rule]));
            
            await helpers.insertCollections(["recurrence_rules"]);
            
            expect(mockValues).toHaveBeenCalled();
            const callArgs = mockValues.mock.calls[0][0];
            expect(callArgs[0].frequency).toBe("WEEKLY");
        });
    });
});
