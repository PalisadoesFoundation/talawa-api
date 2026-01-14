import { describe, it, expect } from "vitest";
import { organizationMembershipsTableInsertSchema } from "~/src/drizzle/tables/organizationMemberships";

const validUUID1 = "550e8400-e29b-41d4-a716-446655440000";
const validUUID2 = "550e8400-e29b-41d4-a716-446655440111";

describe("organization Memberships Table Insert Schema edge cases", () => {
  it("Send an empty object to test basic validation", () => {
    expect(() => organizationMembershipsTableInsertSchema.parse({})).toThrow();
  });

  it("Remove the memberId field from the object", () => {
    const data = {
      organizationId: validUUID2,
      role: "regular",
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).toThrow();
  });

  it("Remove the organizationId field from the object", () => {
    const data = {
      memberId: validUUID1,
      role: "regular",
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).toThrow();
  });

  it("Send object without role", () => {
    const data = {
      memberId: validUUID1,
      organizationId: validUUID2,
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).toThrow();
  });

  it("Put an invalid UUID in the object", () => {
    const data = {
      memberId: "not-a-uuid",
      organizationId: validUUID2,
      role: "regular",
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).toThrow();
  });

  it("Send an object with an invalid role", () => {
    const data = {
      memberId: validUUID1,
      organizationId: validUUID2,
      role: "SUPERADMIN",
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).toThrow();
  });

  it("Send valid object for valid test case", () => {
    const data = {
      memberId: validUUID1,
      organizationId: validUUID2,
      role: "regular",
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).not.toThrow();
  });

  it("Add updaterId and creatorId to the object", () => {
    const data = {
      memberId: validUUID1,
      organizationId: validUUID2,
      role: "administrator",
      creatorId: validUUID1,
      updaterId: validUUID2,
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).not.toThrow();
  });

  it("Test a valid timestamp in the object", () => {
    const data = {
      memberId: validUUID1,
      organizationId: validUUID2,
      role: "regular",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).not.toThrow();
  });

  it("Test a valid updatedAt timestamp in the object", () => {
    const data = {
      memberId: validUUID1,
      organizationId: validUUID2,
      role: "regular",
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).not.toThrow();
  });

  it("Send wrong type for createdAt timestamp", () => {
    const data = {
      memberId: validUUID1,
      organizationId: validUUID2,
      role: "regular",
      createdAt: "not-a-date",
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).toThrow();
  });

  it("Send invalid type for updatedAt timestamp", () => {
    const data = {
      memberId: validUUID1,
      organizationId: validUUID2,
      role: "regular",
      updatedAt: 12345,
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).toThrow();
  });

  it("Send object with admin role", () => {
    const data = {
      memberId: validUUID1,
      organizationId: validUUID2,
      role: "administrator",
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).not.toThrow();
  });

  it("Send object with empty role", () => {
    const data = {
      memberId: validUUID1,
      organizationId: validUUID2,
      role: "",
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).toThrow();
  });

  it("Send object with Null role", () => {
    const data = {
      memberId: validUUID1,
      organizationId: validUUID2,
      role: null,
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).toThrow();
  });

  it("Send null as memberId in object", () => {
    const data = {
      memberId: null,
      organizationId: validUUID2,
      role: "regular",
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).toThrow();
  });

  it("Send null as organizationId in object", () => {
    const data = {
      memberId: validUUID1,
      organizationId: null,
      role: "regular",
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).toThrow();
  });

  it("Send object with empty string memberId", () => {
    const data = {
      memberId: "",
      organizationId: validUUID2,
      role: "regular",
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).toThrow();
  });

  it("Send object with empty string organizationId", () => {
    const data = {
      memberId: validUUID1,
      organizationId: "",
      role: "regular",
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).toThrow();
  });

  it("Send old UUID version for validation", () => {
    const data = {
      memberId: "550e8400-e29b-11d4-a716-446655440000", // v1 UUID
      organizationId: validUUID2,
      role: "regular",
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).not.toThrow();
  });

  it("Send object with random creatorId", () => {
    const data = {
      memberId: validUUID1,
      organizationId: validUUID2,
      role: "regular",
      creatorId: "invalid-uuid",
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).toThrow();
  });

  it("Send object with random updaterId", () => {
    const data = {
      memberId: validUUID1,
      organizationId: validUUID2,
      role: "regular",
      updaterId: "not-valid",
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).toThrow();
  });

  it("Set creatorId to null.", () => {
    const data = {
      memberId: validUUID1,
      organizationId: validUUID2,
      role: "regular",
      creatorId: null,
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).not.toThrow();
  });

  it("Share a null value for updaterId", () => {
    const data = {
      memberId: validUUID1,
      organizationId: validUUID2,
      role: "regular",
      updaterId: null,
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).not.toThrow();
  });

  it("Add an extra key and value to the object", () => {
    const data = {
      memberId: validUUID1,
      organizationId: validUUID2,
      role: "regular",
      unknownField: "should not exist",
    };

    const result = organizationMembershipsTableInsertSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it("Send all valid fields in the object", () => {
    const data = {
      memberId: validUUID1,
      organizationId: validUUID2,
      role: "administrator",
      creatorId: validUUID1,
      updaterId: validUUID2,
      createdAt: new Date("2024-01-01T00:00:00Z"),
      updatedAt: new Date("2024-01-02T00:00:00Z"),
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).not.toThrow();
  });

  it("Use the same UUID for memberId and organizationId", () => {
    const data = {
      memberId: validUUID1,
      organizationId: validUUID1,
      role: "administrator",
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).not.toThrow();
  });

  it("Use the same UUID for memberId and creatorId", () => {
    const data = {
      memberId: validUUID1,
      organizationId: validUUID2,
      role: "regular",
      creatorId: validUUID1,
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).not.toThrow();
  });
});
