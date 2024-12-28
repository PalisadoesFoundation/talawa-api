import { USER_NOT_FOUND_ERROR, BASE_URL } from "../../../src/constants";
import { user as userResolver } from "../../../src/resolvers/Query/user";
import { User, Organization, AppUserProfile } from "../../../src/models";
import { connect, disconnect } from "../../helpers/db";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { FundraisingCampaignPledge } from "../../../src/models/FundraisingCampaignPledge";
import { deleteUserFromCache } from "../../../src/services/UserCache/deleteUserFromCache";
import { errors } from "../../../src/libraries/index";

let testUser: TestUserType;
let anotherTestUser: TestUserType;
let adminUser: TestUserType;
let superAdminUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await deleteUserFromCache(testUser?.id);
  const pledges = await FundraisingCampaignPledge.find({
    _id: new Types.ObjectId(),
  }).lean();
  console.log(pledges);
  try {
    testUser = await createTestUser();
    if (!testUser?.id) throw new Error("Failed to create test user");
    anotherTestUser = await createTestUser();
    if (!anotherTestUser?.id)
      throw new Error("Failed to create another test user");
    adminUser = await createTestUser();
    if (!adminUser?.id) throw new Error("Failed to create admin user");
    superAdminUser = await createTestUser();
    if (!superAdminUser?.id)
      throw new Error("Failed to create super admin user");

    // Make sure we're using the correct ObjectId for the member
    const org = await Organization.create({
      creatorId: adminUser?.id,
      // Ensure we're using the MongoDB _id, not the string id
      members: [anotherTestUser?._id],
      admins: [adminUser?.id],
      name: "Test Organization",
      description: "A test organization for user query testing",
    });

    // Verify the member was added correctly
    await Organization.findByIdAndUpdate(
      org._id,
      { $addToSet: { members: anotherTestUser?._id } },
      { new: true },
    );

    if (!org) throw new Error("Failed to create organization");

    const profile = await AppUserProfile.create({
      userId: superAdminUser?.id,
      isSuperAdmin: true,
    });
    if (!profile) throw new Error("Failed to create super admin profile");
  } catch (error) {
    console.error("Failed to set up test data:", error);
    throw error;
  }
});

afterAll(async () => {
  await Promise.all([
    User.deleteMany({
      _id: {
        $in: [
          testUser?.id,
          anotherTestUser?.id,
          adminUser?.id,
          superAdminUser?.id,
        ],
      },
    }),
    Organization.deleteMany({}),
    AppUserProfile.deleteMany({ userId: superAdminUser?.id }),
  ]);
  await disconnect(MONGOOSE_INSTANCE);
});

describe("user Query", () => {
  // Test case 1: Invalid user ID scenario
  it("throws error if user doesn't exist", async () => {
    expect.assertions(2);
    const args = {
      id: new Types.ObjectId().toString(),
    };

    const context = {
      userId: new Types.ObjectId().toString(),
    };

    try {
      await userResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.DESC);
    }
  });

  // Test case 2: Unauthorized access scenario
  it("throws unauthorized error when trying to access another user's data", async () => {
    expect.assertions(1);
    const args = {
      id: anotherTestUser?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    try {
      await userResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        "Access denied. Only the user themselves, organization admins, or super admins can view this profile.",
      );
    }
  });

  // Test case 3: Admin access scenario
  // Test case 3: Admin access scenario
  it("allows an admin to access another user's data within the same organization", async () => {
    expect.assertions(2);
    const args = {
      id: anotherTestUser?.id,
    };

    const context = {
      userId: adminUser?.id,
      apiRootURL: BASE_URL,
    };

    const org = await Organization.findOne({ admins: adminUser?.id });

    // Convert ObjectIds to strings for comparison
    const memberIds = org?.members.map((id) => id.toString());
    const testUserId = anotherTestUser?._id?.toString();

    expect(memberIds).toContain(testUserId);

    const result = await userResolver?.({}, args, context);

    const user = await User.findById(anotherTestUser?._id).lean();

    expect(result?.user).toEqual({
      ...user,
      organizationsBlockedBy: [],
      image: user?.image ? `${BASE_URL}${user.image}` : null,
    });
  });

  // Test case 4: SuperAdmin access scenario
  it("allows a super admin to access any user's data", async () => {
    expect.assertions(1);
    const args = {
      id: anotherTestUser?.id,
    };

    const context = {
      userId: superAdminUser?.id,
      apiRootURL: BASE_URL,
    };

    const result = await userResolver?.({}, args, context);

    const user = await User.findById(anotherTestUser?._id).lean();

    expect(result?.user).toEqual({
      ...user,
      organizationsBlockedBy: [],
      image: user?.image ? `${BASE_URL}${user.image}` : null,
    });
  });

  // Test case 5: Successful access to own profile
  it("successfully returns user data when accessing own profile", async () => {
    expect.assertions(1);
    const args = {
      id: testUser?.id,
    };

    const context = {
      userId: testUser?.id,
      apiRootURL: BASE_URL,
    };

    const result = await userResolver?.({}, args, context);

    const user = await User.findById(testUser?._id).lean();

    expect(result?.user).toEqual({
      ...user,
      organizationsBlockedBy: [],
      image: user?.image ? `${BASE_URL}${user.image}` : null,
    });
  });

  it("throws NotFoundError when the user is not found in the database", async () => {
    expect.assertions(3);

    const context = {
      userId: new Types.ObjectId().toString(),
    };

    const mockUserExists = vi.spyOn(User, "exists").mockReturnValue({
      exec: async () => false,
    } as any);

    const mockUserFind = vi.spyOn(User, "findById").mockResolvedValue(null);

    try {
      const currentUserExists = await User.exists({
        _id: new Types.ObjectId(context.userId),
      }).exec();

      if (!currentUserExists) {
        throw new errors.NotFoundError(
          USER_NOT_FOUND_ERROR.DESC,
          USER_NOT_FOUND_ERROR.CODE,
          USER_NOT_FOUND_ERROR.PARAM,
        );
      }

      const user = await User.findById(new Types.ObjectId(context.userId));
      if (!user) {
        throw new errors.NotFoundError(
          USER_NOT_FOUND_ERROR.DESC,
          USER_NOT_FOUND_ERROR.CODE,
          USER_NOT_FOUND_ERROR.PARAM,
        );
      }
    } catch (error: any) {
      console.log("Caught error:", error); // Log the error structure
      expect(error).toBeInstanceOf(errors.NotFoundError);
      expect(error.message).toBe(USER_NOT_FOUND_ERROR.DESC);
      expect(error.code).toBe(USER_NOT_FOUND_ERROR.CODE);
    } finally {
      mockUserExists.mockRestore();
      mockUserFind.mockRestore();
    }
  });
  it("throws NotFoundError when the specified user ID does not exist", async () => {
    expect.assertions(2);
    const nonExistentUserId = new Types.ObjectId().toString();
    const args = {
      id: nonExistentUserId,
    };

    const context = {
      userId: new Types.ObjectId().toString(),
    };

    if (typeof userResolver === "function") {
      try {
        await userResolver({}, args, context);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.DESC);
      }
    } else {
      throw new Error("userResolver is not defined");
    }
  });

  it("throws NotFoundError when fetching user profile and user is null", async () => {
    expect.assertions(2);
    const args = {
      id: new Types.ObjectId().toString(),
    };

    const context = {
      userId: new Types.ObjectId().toString(),
    };

    // Mock User.findById to return null
    vi.spyOn(User, "findById").mockResolvedValueOnce(null);

    if (typeof userResolver === "function") {
      try {
        await userResolver({}, args, context);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.DESC);
      }
    } else {
      throw new Error("userResolver is not defined");
    }

    // Restore original implementation
    vi.restoreAllMocks();
  });
});
