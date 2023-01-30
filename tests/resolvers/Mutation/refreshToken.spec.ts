import "dotenv/config";
import { Document, Types } from "mongoose";
import { Interface_User, User } from "../../../src/models";
import { MutationRefreshTokenArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { refreshToken as refreshTokenResolver } from "../../../src/resolvers/Mutation/refreshToken";
import { USER_NOT_FOUND } from "../../../src/constants";
import { createRefreshToken } from "../../../src/utilities";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

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
  it(`throws NotFoundError if no refreshToken is provided using args.refreshToken`, async () => {
    try {
      const args: MutationRefreshTokenArgs = {
        refreshToken: "",
      };

      await refreshTokenResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual("Invalid refreshToken");
    }
  });

  it(`throws NotFoundError if no user exists with _id === payload.userId for
  args.refreshToken`, async () => {
    try {
      refreshToken = await createRefreshToken({
        ...testUser.toObject(),
        _id: Types.ObjectId(),
      });

      const args: MutationRefreshTokenArgs = {
        refreshToken,
      };

      await refreshTokenResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws ValidationError if user.tokenVersion !== payload.tokenVersion for user
  with _id === payload.userId for args.refreshToken`, async () => {
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

      await refreshTokenResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual("Invalid refreshToken");
    }
  });

  it(`generates new accessToken and refreshToken and returns them`, async () => {
    await User.updateOne(
      {
        _id: testUser._id,
      },
      {
        $inc: {
          tokenVersion: -1,
        },
      }
    );

    refreshToken = await createRefreshToken(testUser.toObject());

    const args: MutationRefreshTokenArgs = {
      refreshToken,
    };

    const refreshTokenPayload = await refreshTokenResolver?.({}, args, {});

    expect(typeof refreshTokenPayload?.accessToken).toEqual("string");
    expect(refreshTokenPayload?.accessToken.length).toBeGreaterThan(1);

    expect(typeof refreshTokenPayload?.refreshToken).toEqual("string");
    expect(refreshTokenPayload?.refreshToken.length).toBeGreaterThan(1);
  });
});
