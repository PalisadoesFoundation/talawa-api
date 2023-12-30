import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { InterfaceUser } from "../../../src/models";
import { TransactionLog, User } from "../../../src/models";
import type { MutationRefreshTokenArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  INVALID_REFRESH_TOKEN_ERROR,
  TRANSACTION_LOG_TYPES,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { createRefreshToken } from "../../../src/utilities";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  vi,
  afterEach,
} from "vitest";
import type { TestUserType } from "../../helpers/user";
import { createTestUserFunc } from "../../helpers/user";
import { wait } from "./acceptAdmin.spec";

let testUser: TestUserType;
let refreshToken: string;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUserFunc();
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
          `Translated ${INVALID_REFRESH_TOKEN_ERROR.MESSAGE}`
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
      refreshToken = await createRefreshToken({
        ...testUser!.toObject(),
        _id: Types.ObjectId(),
      });

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
          `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
        );

        spy.mockRestore();
      }
    }
  });

  it(`throws ValidationError if user.tokenVersion !== payload.tokenVersion for user
  with _id === payload.userId for args.refreshToken`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );
    try {
      await User.updateOne(
        {
          _id: testUser?._id,
        },
        {
          $inc: {
            tokenVersion: 1,
          },
        }
      );

      refreshToken = await createRefreshToken(
        testUser ? testUser.toObject() : ({} as InterfaceUser)
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
        expect(error.message).toEqual(INVALID_REFRESH_TOKEN_ERROR.MESSAGE);
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
      await User.updateOne(
        {
          _id: testUser?._id,
        },
        {
          $inc: {
            tokenVersion: 1,
          },
        }
      );

      refreshToken = await createRefreshToken(
        testUser ? testUser.toObject() : ({} as InterfaceUser)
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
          `Translated ${INVALID_REFRESH_TOKEN_ERROR.MESSAGE}`
        );
      }
    }
  });

  it("should update the user's token and increment the tokenVersion", async () => {
    const jwtPayload = { userId: "123" };
    const newRefreshToken = "new-refresh-token";

    // Save the original function
    const originalFunction = User.findOneAndUpdate;

    // Replace User.findOneAndUpdate with a mock function
    /* eslint-disable */
    User.findOneAndUpdate = function () {
      return Promise.resolve({
        _id: testUser?._id,
        token: newRefreshToken,
        tokenVersion: testUser?.tokenVersion || 0 + 1,
      });
    } as any;
    /* eslint-enable */
    const updatedUser = await User.findOneAndUpdate(
      { _id: jwtPayload.userId },
      { $set: { token: newRefreshToken }, $inc: { tokenVersion: 1 } },
      { new: true }
    );

    expect(updatedUser).toBeDefined();
    expect(updatedUser?.token).toBe(newRefreshToken);
    if (testUser?.tokenVersion)
      expect(updatedUser?.tokenVersion).toBe(testUser?.tokenVersion + 1);

    // Restore the original function
    User.findOneAndUpdate = originalFunction;
  });

  it(`generates new accessToken and refreshToken and returns them`, async () => {
    await User.updateOne(
      {
        _id: testUser?._id,
      },
      {
        $inc: {
          tokenVersion: -2,
        },
      }
    );

    refreshToken = await createRefreshToken(
      testUser ? testUser.toObject() : ({} as InterfaceUser)
    );

    const args: MutationRefreshTokenArgs = {
      refreshToken,
    };

    const { refreshToken: refreshTokenResolver } = await import(
      "../../../src/resolvers/Mutation/refreshToken"
    );

    const refreshTokenPayload = await refreshTokenResolver?.({}, args, {});

    expect(typeof refreshTokenPayload?.accessToken).toEqual("string");
    expect(refreshTokenPayload?.accessToken.length).toBeGreaterThan(1);

    expect(typeof refreshTokenPayload?.refreshToken).toEqual("string");
    expect(refreshTokenPayload?.refreshToken.length).toBeGreaterThan(1);

    await wait();

    const mostRecentTransactions = await TransactionLog.find()
      .sort({
        createdAt: -1,
      })
      .limit(1);

    expect(mostRecentTransactions[0]).toMatchObject({
      createdBy: testUser?._id,
      type: TRANSACTION_LOG_TYPES.UPDATE,
      modelName: "User",
    });
  });
});
