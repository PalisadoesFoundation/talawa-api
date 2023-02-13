import "dotenv/config";
import { Types } from "mongoose";
import { User } from "../../../src/models";
import { MutationRefreshTokenArgs } from "../../../src/types/generatedGraphQLTypes";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
import { USER_NOT_FOUND, USER_NOT_FOUND_MESSAGE } from "../../../src/constants";
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
import { createTestUserFunc, testUserType } from "../../helpers/user";

let testUser: testUserType;
let refreshToken: string;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUserFunc();
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Mutation -> refreshToken", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });
  it(`throws NotFoundError if no refreshToken is provided using args.refreshToken and IN_PRODUCTION === false`, async () => {
    try {
      const args: MutationRefreshTokenArgs = {
        refreshToken: "",
      };

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
          IN_PRODUCTION: false,
        };
      });

      const { refreshToken: refreshTokenResolver } = await import(
        "../../../src/resolvers/Mutation/refreshToken"
      );

      await refreshTokenResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual("Invalid refreshToken");
    }
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

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
          IN_PRODUCTION: true,
        };
      });

      const { refreshToken: refreshTokenResolver } = await import(
        "../../../src/resolvers/Mutation/refreshToken"
      );

      await refreshTokenResolver?.({}, args, {});
    } catch (error: any) {
      expect(spy).toBeCalledWith("invalid.refreshToken");
      expect(error.message).toEqual("Translated invalid.refreshToken");
    }
  });

  it(`throws NotFoundError if no user exists with _id === payload.userId for
  args.refreshToken and IN_PRODUCTION === false`, async () => {
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

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
          IN_PRODUCTION: false,
        };
      });

      await refreshTokenResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
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

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
          IN_PRODUCTION: true,
        };
      });

      const { refreshToken: refreshTokenResolver } = await import(
        "../../../src/resolvers/Mutation/refreshToken"
      );

      await refreshTokenResolver?.({}, args, {});
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(`Translated ${USER_NOT_FOUND_MESSAGE}`);

      spy.mockRestore();
    }
  });

  it(`throws ValidationError if user.tokenVersion !== payload.tokenVersion for user
  with _id === payload.userId for args.refreshToken and IN_PRODUCTION === false`, async () => {
    try {
      await User.updateOne(
        {
          _id: testUser!._id,
        },
        {
          $inc: {
            tokenVersion: 1,
          },
        }
      );

      refreshToken = await createRefreshToken(testUser!.toObject());

      const args: MutationRefreshTokenArgs = {
        refreshToken,
      };

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
          IN_PRODUCTION: false,
        };
      });

      const { refreshToken: refreshTokenResolver } = await import(
        "../../../src/resolvers/Mutation/refreshToken"
      );

      await refreshTokenResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual("Invalid refreshToken");
    }
  });

  it(`throws ValidationError if user.tokenVersion !== payload.tokenVersion for user
  with _id === payload.userId for args.refreshToken and IN_PRODUCTION === true`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);
    try {
      await User.updateOne(
        {
          _id: testUser!._id,
        },
        {
          $inc: {
            tokenVersion: 1,
          },
        }
      );

      refreshToken = await createRefreshToken(testUser!.toObject());

      const args: MutationRefreshTokenArgs = {
        refreshToken,
      };

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
          IN_PRODUCTION: true,
        };
      });

      const { refreshToken: refreshTokenResolver } = await import(
        "../../../src/resolvers/Mutation/refreshToken"
      );

      await refreshTokenResolver?.({}, args, {});
    } catch (error: any) {
      expect(spy).toBeCalledWith("invalid.refreshToken");
      expect(error.message).toEqual("Translated invalid.refreshToken");
    }
  });

  it(`generates new accessToken and refreshToken and returns them`, async () => {
    await User.updateOne(
      {
        _id: testUser!._id,
      },
      {
        $inc: {
          tokenVersion: -2,
        },
      }
    );

    refreshToken = await createRefreshToken(testUser!.toObject());

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
