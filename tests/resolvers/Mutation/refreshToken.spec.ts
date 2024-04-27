import "dotenv/config";
import type mongoose from "mongoose";
import type {
  InterfaceAppUserProfile,
  InterfaceUser,
} from "../../../src/models";
import { AppUserProfile, User } from "../../../src/models";
import type { MutationRefreshTokenArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  INVALID_REFRESH_TOKEN_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { createRefreshToken } from "../../../src/utilities";
import { createTestUserFunc } from "../../helpers/user";
import type {
  TestAppUserProfileType,
  TestUserType,
} from "../../helpers/userAndOrg";

let testUser: TestUserType;
let testUserAppProfile: TestAppUserProfileType;
let refreshToken: string;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUserFunc();
  testUserAppProfile = await AppUserProfile.findOne({
    userId: testUser?._id,
  }).lean();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> refreshToken", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no refreshToken is provided using args.refreshToken and IN_PRODUCTION === true`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);
    try {
      const args: MutationRefreshTokenArgs = {
        refreshToken: "",
      };

      const { refreshToken: refreshTokenResolver } = await import(
        "../../../src/resolvers/Mutation/refreshToken"
      );

      await refreshTokenResolver?.({}, args, {});
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(spy).toBeCalledWith(INVALID_REFRESH_TOKEN_ERROR.MESSAGE);
        expect(error.message).toEqual(
          `Translated ${INVALID_REFRESH_TOKEN_ERROR.MESSAGE}`,
        );
      }
    }
  });

  it(`throws NotFoundError if no user exists with _id === payload.userId for
  args.refreshToken and IN_PRODUCTION === true`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);
    try {
      refreshToken = await createRefreshToken(
        testUser ? testUser.toObject() : ({} as InterfaceUser),
        testUserAppProfile
          ? testUserAppProfile
          : ({} as InterfaceAppUserProfile),
      );

      const args: MutationRefreshTokenArgs = {
        refreshToken,
      };

      const { refreshToken: refreshTokenResolver } = await import(
        "../../../src/resolvers/Mutation/refreshToken"
      );

      await refreshTokenResolver?.({}, args, {});
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
        expect(error.message).toEqual(
          `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
        );

        spy.mockRestore();
      }
    }
  });

  it(`throws ValidationError if user.tokenVersion !== payload.tokenVersion for user
  with _id === payload.userId for args.refreshToken`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);
    try {
      await AppUserProfile.updateOne(
        {
          userId: testUser?._id,
        },
        {
          $inc: {
            tokenVersion: 1,
          },
        },
      );

      refreshToken = await createRefreshToken(
        testUser ? testUser.toObject() : ({} as InterfaceUser),
        testUserAppProfile
          ? testUserAppProfile
          : ({} as InterfaceAppUserProfile),
      );

      const args: MutationRefreshTokenArgs = {
        refreshToken,
      };

      const { refreshToken: refreshTokenResolver } = await import(
        "../../../src/resolvers/Mutation/refreshToken"
      );

      await refreshTokenResolver?.({}, args, {});
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(spy).toBeCalledWith(INVALID_REFRESH_TOKEN_ERROR.MESSAGE);
        expect(error.message).toEqual(
          `Translated ${INVALID_REFRESH_TOKEN_ERROR.MESSAGE}`,
        );
      }
    }
  });

  it(`throws ValidationError if user.tokenVersion !== payload.tokenVersion for user
  with _id === payload.userId for args.refreshToken`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);
    try {
      await AppUserProfile.updateOne(
        {
          userId: testUser?._id,
        },
        {
          $inc: {
            tokenVersion: 1,
          },
        },
      );

      refreshToken = await createRefreshToken(
        testUser ? testUser.toObject() : ({} as InterfaceUser),
        testUserAppProfile
          ? testUserAppProfile
          : ({} as InterfaceAppUserProfile),
      );

      const args: MutationRefreshTokenArgs = {
        refreshToken,
      };

      const { refreshToken: refreshTokenResolver } = await import(
        "../../../src/resolvers/Mutation/refreshToken"
      );

      await refreshTokenResolver?.({}, args, {});
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(spy).toBeCalledWith(INVALID_REFRESH_TOKEN_ERROR.MESSAGE);
        expect(error.message).toEqual(
          `Translated ${INVALID_REFRESH_TOKEN_ERROR.MESSAGE}`,
        );
      }
    }
  });

  it("should update the user's token and increment the tokenVersion", async () => {
    const jwtPayload = { userId: "123" };
    const newRefreshToken = "new-refresh-token";

    // Save the original function
    const originalFunction = AppUserProfile.findOneAndUpdate;

    // Replace User.findOneAndUpdate with a mock function
    /* eslint-disable */
    AppUserProfile.findOneAndUpdate = function () {
      return Promise.resolve({
        userId: testUser?._id,
        token: newRefreshToken,
        tokenVersion: testUserAppProfile?.tokenVersion || 0 + 1,
      });
    } as any;
    /* eslint-enable */
    const updatedUserAppProfile = await AppUserProfile.findOneAndUpdate(
      { userId: jwtPayload.userId },
      { $set: { token: newRefreshToken }, $inc: { tokenVersion: 1 } },
      { new: true },
    );

    expect(updatedUserAppProfile).toBeDefined();
    expect(updatedUserAppProfile?.token).toBe(newRefreshToken);
    if (testUserAppProfile?.tokenVersion)
      expect(updatedUserAppProfile?.tokenVersion).toBe(
        testUserAppProfile?.tokenVersion + 1,
      );

    // Restore the original function
    AppUserProfile.findOneAndUpdate = originalFunction;
  });

  it(`generates new accessToken and refreshToken and returns them`, async () => {
    await AppUserProfile.updateOne(
      {
        userId: testUser?._id,
      },
      {
        $inc: {
          tokenVersion: -4,
        },
      },
    );

    refreshToken = await createRefreshToken(
      testUser ? testUser.toObject() : ({} as InterfaceUser),
      testUserAppProfile ? testUserAppProfile : ({} as InterfaceAppUserProfile),
    );
    // console.log(refreshToken)
    const args: MutationRefreshTokenArgs = {
      refreshToken,
    };

    const { refreshToken: refreshTokenResolver } = await import(
      "../../../src/resolvers/Mutation/refreshToken"
    );

    try {
      const refreshTokenPayload = await refreshTokenResolver?.({}, args, {});

      expect(typeof refreshTokenPayload?.accessToken).toEqual("string");
      expect(refreshTokenPayload?.accessToken.length).toBeGreaterThan(1);

      expect(typeof refreshTokenPayload?.refreshToken).toEqual("string");
      expect(refreshTokenPayload?.refreshToken.length).toBeGreaterThan(1);
    } catch (error) {
      expect((error as Error).message).toEqual(
        "i18n is not initialized, try app.use(i18n.init);",
      );
    }
  });
  it("throws error if user does not exists", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);
    const newUser = await createTestUserFunc();
    const newUserAppProfile = await AppUserProfile.findOne({
      userId: newUser?._id,
    }).lean();
    const newRefreshToken = await createRefreshToken(
      newUser ? newUser.toObject() : ({} as InterfaceUser),
      newUserAppProfile
        ? (newUserAppProfile as InterfaceAppUserProfile)
        : ({} as InterfaceAppUserProfile),
    );
    await User.deleteOne({
      _id: newUser?._id,
    });
    await AppUserProfile.deleteOne({
      userId: newUser?._id,
    });
    const args: MutationRefreshTokenArgs = {
      refreshToken: newRefreshToken,
    };
    const { refreshToken: refreshTokenResolver } = await import(
      "../../../src/resolvers/Mutation/refreshToken"
    );
    try {
      await refreshTokenResolver?.({}, args, {});
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
        expect(error.message).toEqual(
          `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
        );
      }
    }
  });
  it("throws error if user does not have appUserProfile ", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);
    const newUser = await createTestUserFunc();
    const newUserAppProfile = await AppUserProfile.findOne({
      userId: newUser?._id,
    }).lean();
    const newRefreshToken = await createRefreshToken(
      newUser ? newUser.toObject() : ({} as InterfaceUser),
      newUserAppProfile
        ? (newUserAppProfile as InterfaceAppUserProfile)
        : ({} as InterfaceAppUserProfile),
    );
    // await User.deleteOne({
    //   _id: newUser?._id,
    // });
    await AppUserProfile.deleteOne({
      userId: newUser?._id,
    });
    const args: MutationRefreshTokenArgs = {
      refreshToken: newRefreshToken,
    };
    const { refreshToken: refreshTokenResolver } = await import(
      "../../../src/resolvers/Mutation/refreshToken"
    );
    try {
      await refreshTokenResolver?.({}, args, {});
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
        expect(error.message).toEqual(
          `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
        );
      }
    }
  });
});
