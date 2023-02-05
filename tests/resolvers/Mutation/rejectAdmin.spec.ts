import "dotenv/config";
import { Types } from "mongoose";
import { User } from "../../../src/models";
import { MutationRejectAdminArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { rejectAdmin as rejectAdminResolver } from "../../../src/resolvers/Mutation/rejectAdmin";
import { USER_NOT_AUTHORIZED, USER_NOT_FOUND } from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestUserFunc, testUserType } from "../../helpers/user";

let testUser: testUserType;

beforeAll(async () => {
  await connect();
  testUser = await createTestUserFunc();
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> rejectAdmin", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationRejectAdminArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await rejectAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws Error if userType of user with _id === context.userId is not SUPERADMIN`, async () => {
    try {
      const args: MutationRejectAdminArgs = {
        id: "",
      };

      const context = {
        userId: testUser!.id,
      };

      await rejectAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.id`, async () => {
    try {
      await User.updateOne(
        {
          _id: testUser!._id,
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
        userId: testUser!.id,
      };

      await rejectAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`deletes the user with _id === args.id and returns true`, async () => {
    const args: MutationRejectAdminArgs = {
      id: testUser!.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const rejectAdminPayload = await rejectAdminResolver?.({}, args, context);

    expect(rejectAdminPayload).toEqual(true);

    const deletedTestUser = await User.findOne({
      _id: testUser!._id,
    }).lean();

    expect(deletedTestUser).toEqual(null);
  });
});
