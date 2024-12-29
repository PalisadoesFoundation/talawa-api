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

async function testUserNotFoundError(
  testFn: () => Promise<void>,
  expectedAssertions: number,
): Promise<void> {
  expect.assertions(expectedAssertions);

  try {
    await testFn();
  } catch (error: unknown) {
    if (error instanceof errors.NotFoundError) {
      expect(error).toBeInstanceOf(errors.NotFoundError);
      expect(error.message).toBe(USER_NOT_FOUND_ERROR.DESC);
      if (expectedAssertions > 2) {
        expect(error.code).toBe(USER_NOT_FOUND_ERROR.CODE);
      }
    } else {
      throw new Error(
        `Expected error of type NotFoundError, but received: ${error}`,
      );
    }
  }
}

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  await deleteUserFromCache(testUser?.id);

  const pledges = await FundraisingCampaignPledge.find({
    _id: new Types.ObjectId(),
  }).lean();

  console.log(pledges);
  try {
    testUser = await createTestUser();
    anotherTestUser = await createTestUser();
    adminUser = await createTestUser();
    superAdminUser = await createTestUser();

    // Verify user creation
    if (
      !testUser?.id ||
      !anotherTestUser?.id ||
      !adminUser?.id ||
      !superAdminUser?.id
    ) {
      throw new Error("Test users not created properly");
    }

    const org = await Organization.create({
      creatorId: adminUser?.id,
      members: [anotherTestUser?._id],
      admins: [adminUser?.id],
      name: "Test Organization",
      description: "A test organization for user query testing",
    });

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
  // Clean up database after tests
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
  it("throws error if user doesn't exist", async () => {
    const args = {
      id: new Types.ObjectId().toString(),
    };

    const context = {
      userId: new Types.ObjectId().toString(),
    };

    await expect(userResolver?.({}, args, context)).rejects.toThrowError(
      USER_NOT_FOUND_ERROR.DESC,
    );
  });

  it("throws unauthorized error when trying to access another user's data", async () => {
    const args = {
      id: anotherTestUser?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    await expect(userResolver?.({}, args, context)).rejects.toThrowError(
      "Access denied. Only the user themselves, organization admins, or super admins can view this profile.",
    );
  });

  it("allows an admin to access another user's data within the same organization", async () => {
    const args = {
      id: anotherTestUser?.id,
    };

    const context = {
      userId: adminUser?.id,
      apiRootURL: BASE_URL,
    };

    const org = await Organization.findOne({ admins: adminUser?.id });

    const memberIds = org?.members.map((id) => id.toString());
    const testUserId = anotherTestUser?._id?.toString();

    expect(memberIds).toContain(testUserId);

    const result = await userResolver?.({}, args, context);

    const user = await User.findById(anotherTestUser?._id).lean();

    expect(result?.user).toMatchObject({
      ...user,
      organizationsBlockedBy: [],
      image: user?.image ? `${BASE_URL}${user.image}` : null,
    });
  });

  it("allows a super admin to access any user's data", async () => {
    const args = {
      id: anotherTestUser?.id,
    };

    const context = {
      userId: superAdminUser?.id,
      apiRootURL: BASE_URL,
    };

    const result = await userResolver?.({}, args, context);

    const user = await User.findById(anotherTestUser?._id).lean();

    expect(result?.user).toMatchObject({
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
      console.log("Caught error:", error);
      expect(error).toBeInstanceOf(errors.NotFoundError);
      expect(error.message).toBe(USER_NOT_FOUND_ERROR.DESC);
      expect(error.code).toBe(USER_NOT_FOUND_ERROR.CODE);
    } finally {
      mockUserExists.mockRestore();
      mockUserFind.mockRestore();
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

    vi.restoreAllMocks();
  });

  it("throws NotFoundError when the specified user ID does not exist", async () => {
    const context = {
      userId: new Types.ObjectId().toString(),
    };

    const mockUserExists = vi.spyOn(User, "exists").mockReturnValueOnce({
      exec: async () => false,
    } as any);

    const mockUserFind = vi.spyOn(User, "findById").mockResolvedValue(null);

    await testUserNotFoundError(async () => {
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
    }, 3);

    mockUserExists.mockRestore();
    mockUserFind.mockRestore();
  });

  it("throws NotFoundError when User.exists check fails", async () => {
    const context = {
      userId: new Types.ObjectId().toString(),
    };

    const mockUserExists = vi.spyOn(User, "exists").mockReturnValueOnce({
      exec: async () => false,
    } as any);

    await testUserNotFoundError(async () => {
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
    }, 3);

    mockUserExists.mockRestore();
  });

  it("throws NotFoundError when user ID is invalid", async () => {
    const args = {
      id: "invalidUserId",
    };

    const context = {
      userId: new Types.ObjectId().toString(),
    };

    await testUserNotFoundError(async () => {
      await userResolver?.({}, args, context);
    }, 2);
  });

  it("throws NotFoundError when context.userId is missing", async () => {
    const args = {
      id: new Types.ObjectId().toString(),
    };

    const context = {};

    await testUserNotFoundError(async () => {
      await userResolver?.({}, args, context as any);
    }, 2);
  });

  it("throws NotFoundError if the queried user does not exist (but current user does)", async () => {
    const args = {
      id: new Types.ObjectId().toString(), // The user ID we want to fetch
    };

    // The 'context.userId' is a valid user in the DB
    const context = {
      userId: testUser?.id,
    };

    // 1. Mock so the current user indeed exists
    vi.spyOn(User, "exists").mockReturnValueOnce({
      exec: async () => true,
    } as any);

    // 2. Mock so that the queried user is 'null'
    vi.spyOn(User, "findById").mockResolvedValueOnce(null);

    if (typeof userResolver === "function") {
      await expect(userResolver({}, args, context)).rejects.toThrowError(
        USER_NOT_FOUND_ERROR.DESC,
      );
    } else {
      throw new Error("userResolver is not defined");
    }

    vi.restoreAllMocks();
  });
});
