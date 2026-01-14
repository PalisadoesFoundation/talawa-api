import { describe, it, expect, vi } from "vitest";

// Prevent server + redis from starting
vi.mock("@/server", () => ({}));
vi.mock("@fastify/redis", () => ({}));

import { organizationMembershipsTableInsertSchema } from "~/src/drizzle/tables/organizationMemberships";

const validUUID1 = "550e8400-e29b-41d4-a716-446655440000";
const validUUID2 = "550e8400-e29b-41d4-a716-446655440111";

describe("organizationMembershipsTableInsertSchema edge cases", () => {
  it("rejects empty input", () => {
    expect(() => organizationMembershipsTableInsertSchema.parse({})).toThrow();
  });

  it("rejects missing memberId", () => {
    const data = {
      organizationId: validUUID2,
      role: "MEMBER",
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).toThrow();
  });

  it("rejects missing organizationId", () => {
    const data = {
      memberId: validUUID1,
      role: "MEMBER",
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).toThrow();
  });

  it("rejects missing role", () => {
    const data = {
      memberId: validUUID1,
      organizationId: validUUID2,
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).toThrow();
  });

  it("rejects invalid UUID format", () => {
    const data = {
      memberId: "not-a-uuid",
      organizationId: validUUID2,
      role: "MEMBER",
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).toThrow();
  });

  it("rejects invalid role enum value", () => {
    const data = {
      memberId: validUUID1,
      organizationId: validUUID2,
      role: "SUPERADMIN",
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).toThrow();
  });

  it("accepts valid membership data", () => {
    const data = {
      memberId: validUUID1,
      organizationId: validUUID2,
      role: "MEMBER",
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).not.toThrow();
  });

  it("allows optional creatorId and updaterId", () => {
    const data = {
      memberId: validUUID1,
      organizationId: validUUID2,
      role: "ADMIN",
      creatorId: validUUID1,
      updaterId: validUUID2,
    };

    expect(() =>
      organizationMembershipsTableInsertSchema.parse(data)
    ).not.toThrow();
  });
});
