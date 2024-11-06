import { USER_NOT_FOUND_ERROR, BASE_URL } from "../../../src/constants";
import type mongoose from "mongoose";
import { user as userResolver } from "../../../src/resolvers/Query/user";
import { User, Organization, AppUserProfile } from "../../../src/models";
import { connect, disconnect } from "../../helpers/db";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUser: TestUserType;
let anotherTestUser: TestUserType;
let adminUser: TestUserType;
let superAdminUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  try {
    testUser = await createTestUser();
    anotherTestUser = await createTestUser();
    adminUser = await createTestUser();
    superAdminUser = await createTestUser();

    await Organization.create({
      creatorId: adminUser?.id,
      members: [anotherTestUser?.id],
      admins: [adminUser?.id],
      name: "Test Organization",
      description: "A test organization for user query testing",
    });

    await AppUserProfile.create({
      userId: superAdminUser?.id,
      isSuperAdmin: true,
    });
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
    expect.assertions(1);
    const args = {
      id: "invalidUserId",
    };

    const context = {
      userId: testUser?.id,
    };

    try {
      await userResolver?.({}, args, context);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error instanceof Error && error.message).toEqual(
        USER_NOT_FOUND_ERROR.DESC,
      );
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
        "Access denied. You can only view your own profile.",
      );
    }
  });

  // Test case 3: Admin access scenario
  it("allows an admin to access another user's data within the same organization", async () => {
    const args = {
      id: anotherTestUser?.id,
    };

    const context = {
      userId: adminUser?.id,
      apiRootURL: BASE_URL,
    };

    const org = await Organization.findOne({ admins: adminUser?.id });
    expect(org?.members).toContain(anotherTestUser?.id);

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
});
