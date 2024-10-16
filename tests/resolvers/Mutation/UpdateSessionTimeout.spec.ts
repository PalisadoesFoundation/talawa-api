import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";

import { User, AppUserProfile, Community } from "../../../src/models";
import type { MutationUpdateSessionTimeoutArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { nanoid } from "nanoid";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  COMMUNITY_NOT_FOUND_ERROR,
  INVALID_TIMEOUT_RANGE,
  USER_NOT_FOUND_ERROR,
  APP_USER_PROFILE_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_SUPERADMIN,
} from "../../../src/constants";
import { updateSessionTimeout as updateSessionTimeoutResolver } from "../../../src/resolvers/Mutation/updateSessionTimeout";
import type {
  TestAppUserProfileType,
  TestUserType,
} from "../../helpers/userAndOrg";

import { requestContext } from "../../../src/libraries";

import bcrypt from "bcryptjs";

// Global variables to store mongoose instance and test user/appUserProfile
let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testAppUserProfile: TestAppUserProfileType;

// Mock the uploadEncodedImage function used in the tests
vi.mock("../../utilities/uploadEncodedImage", () => ({
  uploadEncodedImage: vi.fn(),
}));

// Mock bcrypt.hash to return a fixed value
vi.mock("bcrypt", () => ({
  hash: vi.fn().mockResolvedValue("mockedHashedPassword"),
}));

/**
 * Establishes a connection to the database before all tests.
 */
beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
});

/**
 * Closes the database connection after all tests have completed.
 */
afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

/**
 * Sets up test data in the database before each test.
 * Creates a test user and associated appUserProfile, and links them together.
 * Also, creates a test community with a timeout value.
 */
beforeEach(async () => {
  const hashedPassword = await bcrypt.hash("password", 12);

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: hashedPassword,
    firstName: "firstName",
    lastName: "lastName",
  });

  testAppUserProfile = await AppUserProfile.create({
    userId: testUser._id,
    appLanguageCode: "en",
    tokenVersion: 0,
    isSuperAdmin: true,
  });

  testUser.appUserProfileId = testAppUserProfile._id;
  await testUser.save(); // Directly save the update to testUser

  await Community.create({
    name: "test community",
    timeout: 25,
  });
});

/**
 * Restores all mocks and resets modules after each test.
 */
afterEach(() => {
  vi.restoreAllMocks();
  vi.doUnmock("../../../src/constants");
  vi.resetModules();
});

/**
 * Helper function to handle error assertions.
 * @param resolverFunc - The resolver function to call
 * @param args - The mutation arguments
 * @param context - The request context
 * @param expectedErrorMessage - The expected error message for assertion
 */
const assertThrowsErrorWithMessage = async (
  resolverFunc: typeof updateSessionTimeoutResolver,
  args: MutationUpdateSessionTimeoutArgs,
  context: { userId: string | undefined },
  expectedErrorMessage: string,
): Promise<void> => {
  const spy = vi
    .spyOn(requestContext, "translate")
    .mockImplementation((message) => message);

  try {
    await resolverFunc?.({}, args, context);
  } catch (error: unknown) {
    expect(spy).toHaveBeenCalledWith(expectedErrorMessage);
    expect((error as Error).message).toEqual(expectedErrorMessage);
  }
};

/**
 * Test suite for the `updateSessionTimeout` resolver function.
 */
describe("resolvers -> Mutation -> updateSessionTimeout", () => {
  it("returns error when attempting to update timeout for non-existent community", async () => {
    const args: MutationUpdateSessionTimeoutArgs = {
      timeout: 15,
    };
    const context = {
      userId: testUser?._id,
    };

    await Community.deleteMany({}).lean();

    await assertThrowsErrorWithMessage(
      updateSessionTimeoutResolver,
      args,
      context,
      COMMUNITY_NOT_FOUND_ERROR.MESSAGE,
    );
  });

  it("returns error when attempting to update timeout for non-existent user", async () => {
    const args: MutationUpdateSessionTimeoutArgs = {
      timeout: 15,
    };
    const context = {
      userId: new Types.ObjectId().toString(),
    };

    await assertThrowsErrorWithMessage(
      updateSessionTimeoutResolver,
      args,
      context,
      USER_NOT_FOUND_ERROR.MESSAGE,
    );
  });

  it("returns error when appUserProfile is missing for the user", async () => {
    const args: MutationUpdateSessionTimeoutArgs = {
      timeout: 15,
    };
    const context = {
      userId: testUser?._id,
    };

    await AppUserProfile.deleteOne({ userId: testUser?._id }).lean();

    await assertThrowsErrorWithMessage(
      updateSessionTimeoutResolver,
      args,
      context,
      APP_USER_PROFILE_NOT_FOUND_ERROR.MESSAGE,
    );
  });

  it("returns validation error for timeout out of valid range", async () => {
    const args: MutationUpdateSessionTimeoutArgs = {
      timeout: 3,
    };
    const context = {
      userId: testUser?._id,
    };

    await assertThrowsErrorWithMessage(
      updateSessionTimeoutResolver,
      args,
      context,
      INVALID_TIMEOUT_RANGE.MESSAGE,
    );
  });

  it("returns unauthorized error when superAdmin is set to false", async () => {
    const args: MutationUpdateSessionTimeoutArgs = {
      timeout: 15,
    };
    const context = {
      userId: testUser?._id,
    };

    await AppUserProfile.findByIdAndUpdate(
      { _id: testUser?.appUserProfileId },
      { isSuperAdmin: false },
    ).lean();

    await assertThrowsErrorWithMessage(
      updateSessionTimeoutResolver,
      args,
      context,
      USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE,
    );
  });

  it("successfully updates session timeout when valid arguments are provided", async () => {
    const args: MutationUpdateSessionTimeoutArgs = {
      timeout: 15,
    };
    const context = {
      userId: testUser?._id,
    };

    const result = await updateSessionTimeoutResolver?.({}, args, context);

    expect(result).toEqual(true);
  });
});
