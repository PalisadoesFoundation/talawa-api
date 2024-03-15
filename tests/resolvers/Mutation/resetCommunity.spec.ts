import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationResetCommunityArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
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
import { createTestUserWithUserTypeFunc } from "../../helpers/user";
import { createTestCommunityFunc } from "../../helpers/community";
import {
  USER_NOT_AUTHORIZED_SUPERADMIN,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { Community } from "../../../src/models";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser1: TestUserType;
let testUser2: TestUserType;
let testCommunity: TestCommunityType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser1 = await createTestUserWithUserTypeFunc("SUPERADMIN");
  testUser2 = await createTestUserWithUserTypeFunc("USER");
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

      const context = { userId: Types.ObjectId().toString() };

      const { resetCommunity: resetCommunityResolver } = await import(
        "../../../src/resolvers/Mutation/resetCommunity"
      );

      await resetCommunityResolver?.({}, args, context);
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
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    const args: MutationResetCommunityArgs = {
      id: testCommunity?._id.toString() as string,
    };

    const context = {
      userId: testUser2?._id,
    };

    try {
      const { resetCommunity: resetCommunityResolver } = await import(
        "../../../src/resolvers/Mutation/resetCommunity"
      );

      await resetCommunityResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE}`,
      );
    }
  });

  it(`deletes the previous data and returns true`, async () => {
    const args: MutationResetCommunityArgs = {
      id: testCommunity?._id.toString() as string,
    };
    const context = {
      userId: testUser1?._id,
    };

    const { resetCommunity: resetCommunityResolver } = await import(
      "../../../src/resolvers/Mutation/resetCommunity"
    );

    await resetCommunityResolver?.({}, args, context);

    expect(await Community.findOne()).toBe(null);
  });
});
