import type { Mock } from "vitest";
import { describe, test, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import { verifyRole } from "../../../src/resolvers/Query/verifyRole";
import { AppUserProfile } from "../../../src/models/AppUserProfile";

// Mock environment variables
process.env.ACCESS_TOKEN_SECRET = "test_secret";
process.env.DEFAULT_LANGUAGE_CODE = "en";
process.env.TOKEN_VERSION = "0";
const token = "validToken";
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
        authorization: `Bearer ${token}`,
      },
    };
    vi.restoreAllMocks(); // Reset all mocks before each test
  });

  test("should return unauthorized when Authorization header is missing", async () => {
    const req = { headers: {} }; // No authorization header

    if (verifyRole !== undefined) {
      const result = await verifyRole({}, {}, { req });
      expect(result).toEqual({ role: "", isAuthorized: false });
    } else {
      throw new Error("verifyRole is undefined");
    }
  });
  test("should handle token without 'Bearer' prefix correctly", async () => {
    const req = { headers: { authorization: `${token}` } };

    if (verifyRole !== undefined) {
      vi.spyOn(jwt, "verify").mockImplementationOnce(() => {
        return { userId: "user123" };
      });

      (AppUserProfile.findOne as Mock).mockResolvedValue({
        userId: "user123",
        isSuperAdmin: false,
        adminFor: [],
      });

      const result = await verifyRole({}, {}, { req });
      expect(result).toEqual({ role: "user", isAuthorized: true });
    } else {
      throw new Error("verifyRole is undefined");
    }
  });

  test("should extract token correctly when it starts with 'Bearer '", async () => {
    const req = { headers: { authorization: `Bearer ${token}` } };

    if (verifyRole !== undefined) {
      vi.spyOn(jwt, "verify").mockImplementationOnce(() => {
        return { userId: "user123" };
      });

      (AppUserProfile.findOne as Mock).mockResolvedValue({
        userId: "user123",
        isSuperAdmin: false,
        adminFor: [],
      });

      const result = await verifyRole({}, {}, { req });
      expect(result).toEqual({ role: "user", isAuthorized: true });
    } else {
      throw new Error("verifyRole is undefined");
    }
  });

  test("should return unauthorized when token is missing", async () => {
    const req = { headers: { authorization: "Bearer " } }; // Empty token after 'Bearer'

    if (verifyRole !== undefined) {
      const result = await verifyRole({}, {}, { req });
      expect(result).toEqual({ role: "", isAuthorized: false });
    } else {
      throw new Error("verifyRole is undefined");
    }
  });

  test("should throw an error when userId is missing in the decoded token", async () => {
    const req = { headers: { authorization: `Bearer ${token}` } };

    if (verifyRole !== undefined) {
      // Mock jwt.verify to return a decoded object without userId
      vi.spyOn(jwt, "verify").mockImplementationOnce(() => {
        return { someOtherKey: "someValue" }; // No userId in the decoded token
      });

      const result = await verifyRole({}, {}, { req });

      // We expect the result to contain an error about missing userId
      expect(result).toEqual({
        role: "",
        isAuthorized: false,
        error: "Authentication failed",
      });
    } else {
      throw new Error("verifyRole is undefined");
    }
  });

  test("should return role 'user' for a valid user token", async () => {
    vi.spyOn(jwt, "verify").mockImplementationOnce(() => {
      return { userId: "user123" };
    });
    const req = {
      headers: {
        authorization: `Bearer ${token}`,
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
        authorization: `Bearer ${token}`,
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
        authorization: `Bearer ${token}`,
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
  test("should return role 'user' when a valid user profile is found", async () => {
    const req = { headers: { authorization: `Bearer ${token}` } };

    if (verifyRole !== undefined) {
      // Mock jwt.verify to return a decoded token with userId
      vi.spyOn(jwt, "verify").mockImplementationOnce(() => {
        return { userId: "user123" }; // userId is present
      });

      // Mock the database call to return a valid user profile
      (AppUserProfile.findOne as Mock).mockResolvedValue({
        userId: "user123",
        isSuperAdmin: false,
        adminFor: [],
      });

      const result = await verifyRole({}, {}, { req });

      // We expect to get the role and authorization success
      expect(result).toEqual({ role: "user", isAuthorized: true });
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
        authorization: `Bearer ${token}`,
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
    process.env.ACCESS_TOKEN_SECRET = undefined;
    if (verifyRole !== undefined) {
      const result = await verifyRole({}, {}, { req });
      expect(result).toEqual({
        role: "",
        isAuthorized: false,
        error: "Invalid token",
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
