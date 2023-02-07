import "dotenv/config";
import { Types } from "mongoose";
import { User } from "../../../src/models";
import { MutationUpdateUserTypeArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { updateUserType as updateUserTypeResolver } from "../../../src/resolvers/Mutation/updateUserType";
import { USER_NOT_AUTHORIZED, USER_NOT_FOUND } from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestUserFunc, testUserType } from "../../helpers/user";

let testUsers: testUserType[];

beforeAll(async () => {
  await connect("TALAWA_TESTING_DB");
  const user1 = await createTestUserFunc();
  const user2 = await createTestUserFunc();
  testUsers = [user1, user2];
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> updateUserType", () => {
  it(`throws UnauthorizedError if user with _id === context.userId is not a SUPERADMIN`, async () => {
    try {
      const args: MutationUpdateUserTypeArgs = {
        data: {},
      };

      const context = {
        userId: testUsers[0]!._id,
      };

      await updateUserTypeResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.data.id`, async () => {
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
        data: { id: Types.ObjectId().toString() },
      };
      const context = { userId: testUsers[0]!._id };

      await updateUserTypeResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`updates user.userType of user with _id === args.data.id to args.data.userType`, async () => {
    const args: MutationUpdateUserTypeArgs = {
      data: { id: testUsers[1]!._id, userType: "BLOCKED" },
    };
    const context = { userId: testUsers[0]!._id };

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
