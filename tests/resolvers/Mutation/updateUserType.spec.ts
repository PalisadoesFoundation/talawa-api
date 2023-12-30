import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { TransactionLog, User } from "../../../src/models";
import type { MutationUpdateUserTypeArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  USER_NOT_AUTHORIZED_SUPERADMIN,
  USER_NOT_FOUND_ERROR,
  SUPERADMIN_CANT_CHANGE_OWN_ROLE,
  TRANSACTION_LOG_TYPES,
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
import type { TestUserType } from "../../helpers/user";
import { createTestUserFunc } from "../../helpers/user";
import { wait } from "./acceptAdmin.spec";

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
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
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
      expect(spy).toHaveBeenCalledWith(USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE}`
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
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws SUPERADMIN_CANT_CHANGE_OWN_ROLE_ERROR if the user is a superadmin and tries to downgrade their own role`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateUserTypeArgs = {
        data: {
          id: testUsers[0]?._id.toString(),
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
      expect(spy).toHaveBeenCalledWith(SUPERADMIN_CANT_CHANGE_OWN_ROLE.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${SUPERADMIN_CANT_CHANGE_OWN_ROLE.MESSAGE}`
      );
    }
  });

  it(`updates user.userType of user with _id === args.data.id to args.data.userType`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => `Translated ${message}`
    );

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

    const args: MutationUpdateUserTypeArgs = {
      data: {
        id: testUsers[1]?._id.toString(),
        userType: "BLOCKED",
      },
    };
    const context = {
      userId: testUsers[0]?._id,
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
      _id: testUsers[1]?._id,
    })
      .select("userType")
      .lean();

    expect(updatedTestUser?.userType).toEqual("BLOCKED");

    await wait();

    const mostRecentTransactions = await TransactionLog.find()
      .sort({
        createdAt: -1,
      })
      .limit(1);

    expect(mostRecentTransactions[0]).toMatchObject({
      createdBy: context.userId,
      type: TRANSACTION_LOG_TYPES.UPDATE,
      modelName: "User",
    });
  });
});
