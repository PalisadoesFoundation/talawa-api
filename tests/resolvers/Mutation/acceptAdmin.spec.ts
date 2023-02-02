import "dotenv/config";
import { Types } from "mongoose";
import { MutationAcceptAdminArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { acceptAdmin as acceptAdminResolver } from "../../../src/resolvers/Mutation/acceptAdmin";
import { USER_NOT_AUTHORIZED, USER_NOT_FOUND } from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { testUserType, createTestUser } from "../../helpers/userAndOrg";
import { User } from "../../../src/models";

let testUser: testUserType;

beforeAll(async () => {
  await connect();
  testUser = await createTestUser();
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> acceptAdmin", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationAcceptAdminArgs = {
        id: testUser!.id,
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await acceptAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws Error if user with _id === context.userId is not a SUPERADMIN`, async () => {
    try {
      const args: MutationAcceptAdminArgs = {
        id: testUser!.id,
      };

      const context = {
        userId: testUser!.id,
      };

      await acceptAdminResolver?.({}, args, context);
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

      const args: MutationAcceptAdminArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!.id,
      };

      await acceptAdminResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`makes user with _id === args.id adminApproved and returns true`, async () => {
    const args: MutationAcceptAdminArgs = {
      id: testUser!.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const acceptAdminPayload = await acceptAdminResolver?.({}, args, context);

    expect(acceptAdminPayload).toEqual(true);

    const updatedTestUser = await User.findOne({
      _id: testUser!._id,
    })
      .select(["adminApproved"])
      .lean();

    expect(updatedTestUser?.adminApproved).toEqual(true);
  });
});
