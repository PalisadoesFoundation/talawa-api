import "dotenv/config";
import { Document, Types } from "mongoose";
import { Interface_User, User } from "../../../src/models";
import { MutationRefreshTokenArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { USER_NOT_FOUND, USER_NOT_FOUND_MESSAGE } from "../../../src/constants";
import { createRefreshToken } from "../../../src/utilities";
import { nanoid } from "nanoid";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  vi,
  afterEach,
} from "vitest";

let testUser: Interface_User & Document<any, any, Interface_User>;
let refreshToken: string;

beforeAll(async () => {
  await connect();

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });
});

afterAll(async () => {
  await disconnect();
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
        ...testUser.toObject(),
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
        ...testUser.toObject(),
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
          _id: testUser._id,
        },
        {
          $inc: {
            tokenVersion: 1,
          },
        }
      );

      refreshToken = await createRefreshToken(testUser.toObject());

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
          _id: testUser._id,
        },
        {
          $inc: {
            tokenVersion: 1,
          },
        }
      );

      refreshToken = await createRefreshToken(testUser.toObject());

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
        _id: testUser._id,
      },
      {
        $inc: {
          tokenVersion: -2,
        },
      }
    );

    refreshToken = await createRefreshToken(testUser.toObject());

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
