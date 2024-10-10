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
let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testAppUserProfile: TestAppUserProfileType;

vi.mock("../../utilities/uploadEncodedImage", () => ({
  uploadEncodedImage: vi.fn(),
}));

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

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

  await User.updateOne(
    {
      _id: testUser._id.toString(),
    },
    {
      appUserProfileId: testAppUserProfile?._id?.toString(),
    },
  );

  await Community.create({
    name: "test community",
    timeout: 25,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.doUnmock("../../../src/constants");
  vi.resetModules();
});

describe("resolvers -> Mutation -> updateSessionTimeout", () => {
  it("throws NotFoundError if community does not exist", async () => {
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const args: MutationUpdateSessionTimeoutArgs = {
      timeout: 15,
    };

    const context = {
      userId: testUser?._id,
    };

    await Community.deleteMany({});

    try {
      await updateSessionTimeoutResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(COMMUNITY_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${COMMUNITY_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

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

    await AppUserProfile.deleteOne({ userId: testUser?._id });

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

    AppUserProfile.findByIdAndUpdate(
      {
        _id: testUser?.appUserProfileId,
      },
      {
        isSuperAdmin: false,
      },
    );

    try {
      await updateSessionTimeoutResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE,
      );
    }
  });

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
});
