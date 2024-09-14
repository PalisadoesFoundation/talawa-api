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

  // testUser = await User.findByIdAndUpdate(
  //   testUser._id.toString(),
  //   {
  //     appUserProfileId: testAppUserProfile?._id?.toString(),
  //   },
  //   {
  //     new: true,
  //   },
  // );

  // Instead of separate update, include appUserProfileId at creation
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
 * Test suite for the `updateSessionTimeout` resolver function.
 */
describe("resolvers -> Mutation -> updateSessionTimeout", () => {
  /**
   * Tests that an error is thrown if the community does not exist.
   * Expects a NotFoundError with a translated message.
   */
  it("returns error when attempting to update timeout for non-existent community", async () => {
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const args: MutationUpdateSessionTimeoutArgs = {
      timeout: 15,
    };

    const context = {
      userId: testUser?._id,
    };

    await Community.deleteMany({}).lean();

    try {
      await updateSessionTimeoutResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(COMMUNITY_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${COMMUNITY_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  /**
   * Tests that an error is thrown if the user does not exist.
   * Expects a NotFoundError with a translated message.
   */
  it("throws NotFoundError if user does not exist", async () => {
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateSessionTimeoutArgs = {
        timeout: 15,
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      await updateSessionTimeoutResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  /**
   * Tests that an error is thrown if the appUserProfile does not exist.
   * Expects a NotFoundError with a translated message.
   */
  it("throws NotFoundError if appUserProfile does not exist", async () => {
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const args: MutationUpdateSessionTimeoutArgs = {
      timeout: 15,
    };

    const context = {
      userId: testUser?._id,
    };

    await AppUserProfile.deleteOne({ userId: testUser?._id }).lean();

    try {
      await updateSessionTimeoutResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(
        APP_USER_PROFILE_NOT_FOUND_ERROR.MESSAGE,
      );
      expect((error as Error).message).toEqual(
        `Translated ${APP_USER_PROFILE_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  /**
   * Tests that an error is thrown if the timeout value is out of range.
   * Expects a ValidationError with the appropriate message.
   */
  it("throws ValidationError if timeout is out of range", async () => {
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => message);

    const args: MutationUpdateSessionTimeoutArgs = {
      timeout: 3,
    };

    const context = {
      userId: testUser?._id,
    };

    try {
      await updateSessionTimeoutResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(INVALID_TIMEOUT_RANGE.MESSAGE);
      expect((error as Error).message).toEqual(INVALID_TIMEOUT_RANGE.MESSAGE);
    }
  });

  /**
   * Tests that the session timeout is updated successfully.
   * Expects the resolver to return true upon successful update.
   */
  it("updates session timeout successfully", async () => {
    const args: MutationUpdateSessionTimeoutArgs = {
      timeout: 15,
    };

    const context = {
      userId: testUser?._id,
    };

    const result = await updateSessionTimeoutResolver?.({}, args, context);

    expect(result).toEqual(true);
  });

  /**
   * Tests that an error is thrown if the user is not a superAdmin.
   * Expects an UnauthorizedError with the appropriate message.
   */
  it("throws UnauthorizedError if superAdmin is false", async () => {
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => message);

    const args: MutationUpdateSessionTimeoutArgs = {
      timeout: 15,
    };

    const context = {
      userId: testUser?._id,
    };

    await AppUserProfile.findByIdAndUpdate(
      {
        // userId: testUser?._id,
        // _id: testAppUserProfile?._id,
        _id: testUser?.appUserProfileId,
      },
      {
        isSuperAdmin: false,
      },
    ).lean();

    try {
      await updateSessionTimeoutResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE,
      );
    }
  });
});
