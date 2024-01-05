import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User } from "../../../src/models";
import type { MutationUpdateAppUserTypeArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { USER_NOT_FOUND_ERROR } from "../../../src/constants";
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
import { createTestUserFunc } from "../../helpers/user";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUsers: TestUserType[];

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const user1 = await createTestUserFunc();
  const user2 = await createTestUserFunc();
  testUsers = [user1, user2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

afterEach(() => {
  vi.doUnmock("../../../src/constants");
  vi.resetModules();
});

describe("resolvers -> Mutation -> updateAppUserType", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateAppUserTypeArgs = {
        data: {
          id: Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { updateAppUserType: updateAppUserTypeResolver } = await import(
        "../../../src/resolvers/Mutation/updateAppUserType"
      );

      await updateAppUserTypeResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.data.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      await User.updateOne(
        {
          _id: testUsers[0]?._id,
        },
        {
          userType: "SUPERADMIN",
        },
        {
          new: true,
        }
      );

      const args: MutationUpdateAppUserTypeArgs = {
        data: {
          id: Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: testUsers[0]?._id,
      };

      const { updateAppUserType: updateAppUserTypeResolver } = await import(
        "../../../src/resolvers/Mutation/updateAppUserType"
      );

      await updateAppUserTypeResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });
  it(`updates user.appUserType of user when _id === args.data.id to args.data.appUserType`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => `Translated ${message}`
    );

    await User.updateOne(
      {
        _id: testUsers[0]?._id,
      },
      {
        appUserType: "NON_APP_USER",
      },
      {
        new: true,
      }
    );

    const args: MutationUpdateAppUserTypeArgs = {
      data: {
        id: testUsers[1]?._id.toString(),
        appUserType: "NON_APP_USER",
      },
    };
    const context = {
      userId: testUsers[0]?._id,
    };

    const { updateAppUserType: updateAppUserTypeResolver } = await import(
      "../../../src/resolvers/Mutation/updateAppUserType"
    );

    const updateAppUserTypePayload = await updateAppUserTypeResolver?.(
      {},
      args,
      context
    );

    expect(updateAppUserTypePayload).toEqual(true);

    const updatedTestUser = await User.findOne({
      _id: testUsers[1]?._id,
    })
      .select("appUserType")
      .lean();

    expect(updatedTestUser?.appUserType).toEqual("NON_APP_USER");
  });
});
