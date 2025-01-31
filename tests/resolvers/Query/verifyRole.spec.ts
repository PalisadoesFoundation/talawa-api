import type { Mock } from "vitest";
import { describe, test, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import { verifyRole } from "../../../src/resolvers/Query/verifyRole";
import { AppUserProfile } from "../../../src/models/AppUserProfile";

// Mock environment variables
process.env.ACCESS_TOKEN_SECRET = "test_secret";
process.env.DEFAULT_LANGUAGE_CODE = "en";
process.env.TOKEN_VERSION = "0";
// Mock database call
vi.mock("../../../src/models/AppUserProfile", () => ({
  AppUserProfile: {
    findOne: vi.fn().mockResolvedValue({
      lean: () => ({ userId: "user123", isSuperAdmin: false, adminFor: [] }),
    }),
  },
}));
describe("verifyRole", () => {
  let req: any;
  beforeEach(() => {
    req = {
      headers: {
        authorization: "Bearer validToken",
      },
    };
    vi.restoreAllMocks(); // Reset all mocks before each test
  });

  test("should return role 'user' for a valid user token", async () => {
    vi.spyOn(jwt, "verify").mockImplementationOnce(() => {
      return { userId: "user123" };
    });
    const req = {
      headers: {
        authorization: "Bearer validToken",
      },
    };
    (AppUserProfile.findOne as Mock).mockResolvedValue({
      userId: "user123",
      isSuperAdmin: false,
      adminFor: [],
    });
    // Mock database call for the user
    if (verifyRole !== undefined) {
      const result = await verifyRole({}, {}, { req });
      expect(result).toEqual({ role: "user", isAuthorized: true });
    } else {
      throw new Error("verifyRole is undefined");
    }
  });

  test("should return role 'admin' for a valid admin token", async () => {
    vi.spyOn(jwt, "verify").mockImplementationOnce(() => {
      return { userId: "admin123" };
    });
    const req = {
      headers: {
        authorization: "Bearer validToken",
      },
    };
    (AppUserProfile.findOne as Mock).mockResolvedValue({
      userId: "admin123",
      isSuperAdmin: false,
      adminFor: ["Angel Foundation"],
    });
    if (verifyRole !== undefined) {
      const result = await verifyRole({}, {}, { req });
      expect(result).toEqual({ role: "admin", isAuthorized: true });
    } else {
      throw new Error("verifyRole is undefined");
    }
  });

  test("should return role 'superAdmin' for a valid superAdmin token", async () => {
    vi.spyOn(jwt, "verify").mockImplementationOnce(() => {
      return { userId: "superadmin123" };
    });

    const req = {
      headers: {
        authorization: "Bearer validToken",
      },
    };
    (AppUserProfile.findOne as Mock).mockResolvedValue({
      userId: "superadmin123",
      isSuperAdmin: true,
      adminFor: [],
    });
    if (verifyRole !== undefined) {
      const result = await verifyRole({}, {}, { req });
      expect(result).toEqual({ role: "superAdmin", isAuthorized: true });
    } else {
      throw new Error("verifyRole is undefined");
    }
  });

  test("should return unauthorized when user is not found in DB", async () => {
    vi.spyOn(jwt, "verify").mockImplementationOnce(() => {
      return { userId: "unknownUser" };
    });
    const req = {
      headers: {
        authorization: "Bearer validToken",
      },
    };
    (AppUserProfile.findOne as Mock).mockResolvedValue(null);
    if (verifyRole !== undefined) {
      const result = await verifyRole({}, {}, { req });
      expect(result).toEqual({
        role: "",
        isAuthorized: false,
        error: "Authentication failed",
      });
    } else {
      throw new Error("verifyRole is undefined");
    }
  });

  test("should handle missing ACCESS_TOKEN_SECRET", async () => {
    delete process.env.ACCESS_TOKEN_SECRET;
    if (verifyRole !== undefined) {
      const result = await verifyRole({}, {}, { req });
      expect(result).toEqual({
        role: "",
        isAuthorized: false,
        error: "Authentication failed",
      });
      // Restore ACCESS_TOKEN_SECRET
      process.env.ACCESS_TOKEN_SECRET = "test_secret";
    } else {
      throw new Error("verifyRole is undefined");
    }
  });

  test("should handle malformed token", async () => {
    // Simulate a malformed token error
    const verify = vi.fn().mockImplementation(() => {
      throw new Error("jwt malformed");
    });
    vi.stubGlobal("jwt", { ...jwt, verify });
    if (verifyRole !== undefined) {
      const result = await verifyRole({}, {}, { req });
      expect(result).toEqual({
        role: "",
        isAuthorized: false,
        error: "Invalid token",
      });
    } else {
      throw new Error("verifyRole is undefined");
    }
  });
});
