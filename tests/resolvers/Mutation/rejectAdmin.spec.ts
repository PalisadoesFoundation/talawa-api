import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User } from "../../../src/models";
import type {
  MutationRejectAdminArgs,
  TransactionLog,
} from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { rejectAdmin as rejectAdminResolver } from "../../../src/resolvers/Mutation/rejectAdmin";
import {
  TRANSACTION_LOG_TYPES,
  USER_NOT_AUTHORIZED_SUPERADMIN,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  afterEach,
  vi,
} from "vitest";
import type { TestUserType } from "../../helpers/user";
import { createTestUserFunc } from "../../helpers/user";
import { wait } from "./acceptAdmin.spec";
import { getTransactionLogs } from "../../../src/resolvers/Query/getTransactionLogs";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser1: TestUserType;
let testUser2: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser1 = await createTestUserFunc();
  testUser2 = await createTestUserFunc();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> rejectAdmin", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });
  it(`throws Error if userType of user with _id === context.userId is not SUPERADMIN`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationRejectAdminArgs = {
        id: "",
      };

      const context = {
        userId: testUser1?.id,
      };
      await User.findByIdAndUpdate(
        {
          _id: testUser1?._id,
        },
        {
          userType: "USER",
        }
      );
      await rejectAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE}`
      );

      expect(spy).toHaveBeenCalledWith(USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE);
    }
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationRejectAdminArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { rejectAdmin: rejectAdminResolver } = await import(
        "../../../src/resolvers/Mutation/rejectAdmin"
      );

      await rejectAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      await User.updateOne(
        {
          _id: testUser1?._id,
        },
        {
          $set: {
            userType: "SUPERADMIN",
          },
        }
      );

      const args: MutationRejectAdminArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser1?.id,
      };

      const { rejectAdmin: rejectAdminResolver } = await import(
        "../../../src/resolvers/Mutation/rejectAdmin"
      );
      await rejectAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("should not delete the user with _id === args.id but set its adminApproved property to false", async () => {
    const args: MutationRejectAdminArgs = {
      id: testUser2?.id,
    };

    const context = {
      userId: testUser1?.id,
    };

    const { rejectAdmin: rejectAdminResolver } = await import(
      "../../../src/resolvers/Mutation/rejectAdmin"
    );

    const flag = await rejectAdminResolver?.({}, args, context);

    expect(flag).toBe(true);

    await wait();

    const mostRecentTransactions = getTransactionLogs!({}, {}, {})!;

    expect((mostRecentTransactions as TransactionLog[])[0]).toMatchObject({
      createdBy: testUser1?._id.toString(),
      type: TRANSACTION_LOG_TYPES.UPDATE,
      model: "User",
    });
  });
});
