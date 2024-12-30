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
import { errors } from "../../../src/libraries";

// Mock FundraisingCampaignPledge populate
vi.mock("../../../src/models/FundraisingCampaignPledge", () => ({
  FundraisingCampaignPledge: {
    schema: {
      obj: {},
      paths: {},
      tree: {},
      virtuals: {},
      methods: {},
      statics: {},
    },
  },
}));

type AdditionalUserFields = {
  createdAt?: Date;
  updatedAt?: Date;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  blocked?: boolean;
  role?: string;
  userType?: string;
  appLanguageCode?: string;
  pluginCreationAllowed?: boolean;
  adminApproved?: boolean;
  adminFor?: mongoose.Types.ObjectId[];
  memberOf?: mongoose.Types.ObjectId[];
  createdOrganizations?: mongoose.Types.ObjectId[];
  joinedOrganizations?: mongoose.Types.ObjectId[];
  registeredEvents?: mongoose.Types.ObjectId[];
  eventAdmin?: mongoose.Types.ObjectId[];
  createdEvents?: mongoose.Types.ObjectId[];
  tokenVersion?: number;
};

type UserType = {
  _id: mongoose.Types.ObjectId;
  email: string;
  firstName?: string;
  lastName?: string;
  image?: string | null;
  organizationsBlockedBy: string[];
} & AdditionalUserFields;

type ResolverReturnType = {
  user: UserType;
};

// Rename `ITestUsers` to `TestInterfaceUsers`
interface TestInterfaceUsers {
  testUser: NonNullable<TestUserType>;
  anotherTestUser: NonNullable<TestUserType>;
  adminUser: NonNullable<TestUserType>;
  superAdminUser: NonNullable<TestUserType>;
}

let users: TestInterfaceUsers;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  try {
    MONGOOSE_INSTANCE = await connect();

    // Register FundraisingCampaignPledge schema mock
    if (!MONGOOSE_INSTANCE.models.FundraisingCampaignPledge) {
      MONGOOSE_INSTANCE.model(
        "FundraisingCampaignPledge",
        FundraisingCampaignPledge.schema,
      );
    }

    // Create users sequentially
    const [testUser, anotherTestUser, adminUser, superAdminUser] =
      await Promise.all([
        createTestUser(),
        createTestUser(),
        createTestUser(),
        createTestUser(),
      ]);

    // Verify all users were created
    if (!testUser || !anotherTestUser || !adminUser || !superAdminUser) {
      throw new Error("Failed to create test users");
    }

    users = { testUser, anotherTestUser, adminUser, superAdminUser };

    // Create organization
    const org = await Organization.create({
      creatorId: users.adminUser._id,
      members: [users.anotherTestUser._id],
      admins: [users.adminUser._id],
      name: "Test Organization",
      description: "Test organization",
    });

    if (!org) {
      throw new Error("Failed to create organization");
    }

    // Update super admin profile
    const superAdminUpdate = await AppUserProfile.findOneAndUpdate(
      { userId: users.superAdminUser._id },
      { isSuperAdmin: true },
      { new: true },
    );

    if (!superAdminUpdate) {
      throw new Error("Failed to update super admin profile");
    }
  } catch (error) {
    console.error("Setup failed:", error);
    throw error;
  }
}, 30000);

afterAll(async () => {
  if (users) {
    await Promise.all([
      User.deleteMany({
        _id: { $in: Object.values(users).map((user) => user._id) },
      }),
      Organization.deleteMany({}),
      AppUserProfile.deleteMany({
        userId: { $in: Object.values(users).map((user) => user._id) },
      }),
    ]);
  }
  await disconnect(MONGOOSE_INSTANCE);
}, 30000);

describe("user Query", () => {
  it("throws error if user doesn't exist", async () => {
    const args = { id: new Types.ObjectId().toString() };
    const context = { userId: new Types.ObjectId().toString() };

    await expect(userResolver?.({}, args, context)).rejects.toThrow(
      USER_NOT_FOUND_ERROR.DESC,
    );
  });

  it("throws unauthorized error when trying to access another user's data", async () => {
    const args = { id: users.anotherTestUser._id.toString() };
    const context = { userId: users.testUser._id.toString() };

    await expect(userResolver?.({}, args, context)).rejects.toThrow(
      "Access denied. Only the user themselves, organization admins, or super admins can view this profile.",
    );
  });

  it("allows an admin to access another user's data within the same organization", async () => {
    const args = { id: users.anotherTestUser._id.toString() };
    const context = {
      userId: users.adminUser._id.toString(),
      apiRootURL: BASE_URL,
    };

    const result = (await userResolver?.(
      {},
      args,
      context,
    )) as ResolverReturnType;
    const user = await User.findById(users.anotherTestUser._id).lean();

    expect(result.user._id.toString()).toBe(
      users.anotherTestUser._id.toString(),
    );
    expect(result.user).toEqual({
      ...user,
      organizationsBlockedBy: [],
      image: user?.image ? `${BASE_URL}${user.image}` : null,
    });
  });

  it("allows a super admin to access any user's data", async () => {
    const args = { id: users.anotherTestUser._id.toString() };
    const context = {
      userId: users.superAdminUser._id.toString(),
      apiRootURL: BASE_URL,
    };

    const result = (await userResolver?.(
      {},
      args,
      context,
    )) as ResolverReturnType;
    const user = await User.findById(users.anotherTestUser._id).lean();

    expect(result.user).toEqual({
      ...user,
      organizationsBlockedBy: [],
      image: user?.image ? `${BASE_URL}${user.image}` : null,
    });
  });

  it("successfully returns user data when accessing own profile", async () => {
    const args = { id: users.testUser._id.toString() };
    const context = {
      userId: users.testUser._id.toString(),
      apiRootURL: BASE_URL,
    };

    const result = (await userResolver?.(
      {},
      args,
      context,
    )) as ResolverReturnType;
    const user = await User.findById(users.testUser._id).lean();

    expect(result.user).toEqual({
      ...user,
      organizationsBlockedBy: [],
      image: user?.image ? `${BASE_URL}${user.image}` : null,
    });
  });

  it("should throw NotFoundError with correct error details when requested user does not exist but current user exists", async () => {
    const args = { id: new Types.ObjectId().toString() };
    const context = { userId: users.superAdminUser._id.toString() };

    await expect(userResolver?.({}, args, context)).rejects.toThrowError(
      new errors.NotFoundError(
        USER_NOT_FOUND_ERROR.DESC,
        USER_NOT_FOUND_ERROR.CODE,
        USER_NOT_FOUND_ERROR.PARAM,
      ),
    );
  });

  it("should throw UnauthorizedError when trying to access another user's data", async () => {
    const args = { id: users.anotherTestUser._id.toString() };
    const context = { userId: users.testUser._id.toString() };

    await expect(userResolver?.({}, args, context)).rejects.toThrowError(
      new errors.UnauthorizedError(
        "Access denied. Only the user themselves, organization admins, or super admins can view this profile.",
      ),
    );
  });
});
