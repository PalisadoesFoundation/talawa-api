import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { InterfaceUser } from "../../../src/models";
import { User } from "../../../src/models";
import type { MutationRefreshTokenArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  INVALID_REFRESH_TOKEN_ERROR,
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
    } catch (error: any) {
      expect(spy).toBeCalledWith(INVALID_REFRESH_TOKEN_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${INVALID_REFRESH_TOKEN_ERROR.MESSAGE}`
      );
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
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );

      spy.mockRestore();
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
    } catch (error: any) {
      expect(error.message).toEqual(INVALID_REFRESH_TOKEN_ERROR.MESSAGE);
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
    } catch (error: any) {
      expect(spy).toBeCalledWith(INVALID_REFRESH_TOKEN_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${INVALID_REFRESH_TOKEN_ERROR.MESSAGE}`
      );
    }
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
  });
});
