import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
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
import type { TestUserType } from "../../helpers/user";
import { createTestUserFunc } from "../../helpers/user";
import {
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_AUTHORIZED_SUPERADMIN,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { AppUserProfile, Community, User } from "../../../src/models";
import { nanoid } from "nanoid";
import { resetCommunity } from "../../../src/resolvers/Mutation/resetCommunity";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser1: TestUserType;
let testUser2: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser1 = await createTestUserFunc();
  testUser2 = await createTestUserFunc();
  await AppUserProfile.updateOne(
    {
      userId: testUser1?._id,
    },
    {
      $set: {
        isSuperAdmin: true,
      },
    },
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

afterEach(() => {
  vi.doUnmock("../../../src/constants");
  vi.resetModules();
});

describe("resolvers -> Mutation -> resetCommunity", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const context = { userId: new Types.ObjectId().toString() };

      const { resetCommunity: resetCommunityResolver } = await import(
        "../../../src/resolvers/Mutation/resetCommunity"
      );

      await resetCommunityResolver?.({}, {}, context);
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
        expect(error.message).toEqual(
          `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
        );
      }
    }
  });

  it(`throws Unauthorized error if the current user is not an admin of the  event`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const newUser = await User.create({
        email: `email${nanoid().toLowerCase()}@gmail.com`,
        password: `pass${nanoid().toLowerCase()}`,
        firstName: `firstName${nanoid().toLowerCase()}`,
        lastName: `lastName${nanoid().toLowerCase()}`,
        image: null,
      });

      const context = {
        userId: newUser.id,
      };

      const { resetCommunity: resetCommunityResolver } = await import(
        "../../../src/resolvers/Mutation/resetCommunity"
      );

      await resetCommunityResolver?.({}, {}, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is not superadmin with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    const context = {
      userId: testUser2?._id,
    };

    try {
      const { resetCommunity: resetCommunityResolver } = await import(
        "../../../src/resolvers/Mutation/resetCommunity"
      );

      await resetCommunityResolver?.({}, {}, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE}`,
      );
    }
  });

  it(`deletes the previous data and returns true`, async () => {
    const context = {
      userId: testUser1?._id,
    };

    await resetCommunity?.({}, {}, context);
    expect(await Community.findOne()).toBe(null);
  });
});
