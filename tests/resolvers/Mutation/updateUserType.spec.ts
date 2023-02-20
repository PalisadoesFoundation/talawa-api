import "dotenv/config";
import { Types } from "mongoose";
import { User } from "../../../src/models";
import { MutationUpdateUserTypeArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import {
  USER_NOT_AUTHORIZED_SUPERADMIN,
  USER_NOT_FOUND_MESSAGE,
} from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  afterEach,
  describe,
  it,
  vi,
  expect,
} from "vitest";
import { createTestUserFunc, testUserType } from "../../helpers/user";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testUsers: testUserType[];

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const user1 = await createTestUserFunc();
  const user2 = await createTestUserFunc();
  testUsers = [user1, user2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

afterEach(() => {
  vi.doUnmock("../../../src/constants");
  vi.resetModules();
});

describe("resolvers -> Mutation -> updateUserType", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateUserTypeArgs = {
        data: {
          id: Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { updateUserType: updateUserTypeResolver } = await import(
        "../../../src/resolvers/Mutation/updateUserType"
      );

      await updateUserTypeResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(`Translated ${USER_NOT_FOUND_MESSAGE}`);
    }
  });

  it(`throws USER not super admin error if no user with _id === context.userId is not a SUPERADMIN`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateUserTypeArgs = {
        data: {
          id: Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: testUsers[0]?._id,
      };

      const { updateUserType: updateUserTypeResolver } = await import(
        "../../../src/resolvers/Mutation/updateUserType"
      );

      await updateUserTypeResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_AUTHORIZED_SUPERADMIN.message);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_SUPERADMIN.message}`
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
          _id: testUsers[0]!._id,
        },
        {
          userType: "SUPERADMIN",
        },
        {
          new: true,
        }
      );

      const args: MutationUpdateUserTypeArgs = {
        data: {
          id: Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: testUsers[0]!._id,
      };

      const { updateUserType: updateUserTypeResolver } = await import(
        "../../../src/resolvers/Mutation/updateUserType"
      );

      await updateUserTypeResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(`Translated ${USER_NOT_FOUND_MESSAGE}`);
    }
  });

  it(`updates user.userType of user with _id === args.data.id to args.data.userType`, async () => {
    const args: MutationUpdateUserTypeArgs = {
      data: {
        id: testUsers[1]!._id,
        userType: "BLOCKED",
      },
    };
    const context = {
      userId: testUsers[0]!._id,
    };

    const { updateUserType: updateUserTypeResolver } = await import(
      "../../../src/resolvers/Mutation/updateUserType"
    );

    const updateUserTypePayload = await updateUserTypeResolver?.(
      {},
      args,
      context
    );

    expect(updateUserTypePayload).toEqual(true);

    const updatedTestUser = await User.findOne({
      _id: testUsers[1]!._id,
    })
      .select("userType")
      .lean();

    expect(updatedTestUser!.userType).toEqual("BLOCKED");
  });
});
