import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { Community } from "../../../src/models";
import type { MutationResetCommunityArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import { resetCommunity } from "../../../src/resolvers/Mutation/resetCommunity";
import {
  beforeAll,
  afterAll,
  afterEach,
  describe,
  it,
  vi,
  expect,
} from "vitest";
import type { TestUserType } from "../../helpers/user";
import type { TestCommunityType } from "../../helpers/community";
import {  createTestUserFunc} from "../../helpers/user";
import { createTestCommunityFunc } from "../../helpers/community";
import {
  COMMUNITY_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_SUPERADMIN,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { createTestSuperAdmin } from "../../helpers/advertisement";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser1: TestUserType;
let testUser2: TestUserType;
let testCommunity: TestCommunityType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser1 =   await createTestSuperAdmin();
  testUser2 = await createTestUserFunc(); //normalUser
  testCommunity = await createTestCommunityFunc();
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
      const args: MutationResetCommunityArgs = {
        id: testCommunity?._id.toString() as string,
      };

      const context = { userId: new Types.ObjectId().toString() };

      await resetCommunity?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
        expect(error.message).toEqual(
          `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
        );
      }
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is not superadmin with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => `Translated ${message}`,
    );

    const args: MutationResetCommunityArgs = {
      id: testCommunity?._id.toString() as string,
    };

    const context = {
      userId: testUser2?._id,
    };

    try {
      await resetCommunity?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toEqual(
          `Translated ${USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE}`,
        );
      }
    }
  });

  it(`throws NotFoundError if no community exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => `Translated ${message}`,
    );

    try {
      const args: MutationResetCommunityArgs = {
        id: new Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser1?._id,
      };

      await resetCommunity?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toEqual(
          `Translated ${COMMUNITY_NOT_FOUND_ERROR.MESSAGE}`,
        );
      }
    }
  });

  it(`updates the community with default values and returns true`, async () => {
    const context = { userId: testUser1?._id };
    const args: MutationResetCommunityArgs = {
      id: testCommunity?._id.toString() as string,
    };

    const result = await resetCommunity?.({}, args, context);
    expect(result).toBe(true);
  });

  it(`updates the community with default values and returns true while deleting the previous logo if present`, async () => {
    const context = { userId: testUser1?._id };
    const args: MutationResetCommunityArgs = {
      id: testCommunity?._id.toString() as string,
    };

    const deletePreviousImage = await import(
      "../../../src/utilities/encodedImageStorage/deletePreviousImage"
    );
    vi.spyOn(deletePreviousImage, "deletePreviousImage").mockImplementation(
      () => {
        return Promise.resolve();
      },
    );

    await Community.findByIdAndUpdate(
      testCommunity?._id,
      {
        logoUrl: "fakeLogoPath.png",
      },
      { new: true },
    );

    const result = await resetCommunity?.({}, args, context);
    expect(result).toBe(true);
  });
});
