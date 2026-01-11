import { describe, it, expect, vi, beforeEach } from "vitest";

// We mock the modules BEFORE anything else happens
vi.mock("node:fs/promises");

describe("Seeder Infrastructure Tests", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("should validate iCalendar formatting (RFC 5545)", async () => {
    // Dynamically import to ensure mocks are respected
    const { toICalendarUntil } = await import("../../scripts/dbManagement/helpers");
    const date = new Date("2026-01-15T14:30:45Z");
    expect(toICalendarUntil(date)).toBe("20260115T143045Z");
  });

  it("should strictly parse dates and handle invalid types", async () => {
    const { parseDate } = await import("../../scripts/dbManagement/helpers");
    expect(parseDate([])).toBeNull();
    expect(parseDate(null)).toBeNull();
    expect(parseDate("2025-01-01")).toBeInstanceOf(Date);
  });

  it("should handle pingDB failures gracefully", async () => {
    const { pingDB, db } = await import("../../scripts/dbManagement/helpers");
    vi.spyOn(db, 'execute').mockRejectedValueOnce(new Error("DB Down"));
    const result = await pingDB();
    expect(result).toBe(false);
  });
});
