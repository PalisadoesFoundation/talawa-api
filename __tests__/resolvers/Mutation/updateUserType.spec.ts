import "dotenv/config";
import { Document, Types } from "mongoose";
import { nanoid } from "nanoid";
import { Interface_User, User } from "../../../src/lib/models";
import { MutationUpdateUserTypeArgs } from "../../../src/generated/graphqlCodegen";
import { connect, disconnect } from "../../../src/db";
import { updateUserType as updateUserTypeResolver } from "../../../src/lib/resolvers/Mutation/updateUserType";
import { USER_NOT_AUTHORIZED, USER_NOT_FOUND } from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUsers: (Interface_User & Document<any, any, Interface_User>)[];

beforeAll(async () => {
  await connect();

  testUsers = await User.insertMany([
    {
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: "password",
      firstName: "firstName",
      lastName: "lastName",
      appLanguageCode: "en",
    },
    {
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: "password",
      firstName: "firstName",
      lastName: "lastName",
      appLanguageCode: "en",
    },
  ]);
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
        userId: testUsers[0]._id,
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
          _id: testUsers[0]._id,
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
      const context = { userId: testUsers[0]._id };

      await updateUserTypeResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`updates user.userType of user with _id === args.data.id to args.data.userType`, async () => {
    const args: MutationUpdateUserTypeArgs = {
      data: { id: testUsers[1]._id, userType: "BLOCKED" },
    };
    const context = { userId: testUsers[0]._id };

    const updateUserTypePayload = await updateUserTypeResolver?.(
      {},
      args,
      context
    );

    expect(updateUserTypePayload).toEqual(true);

    const updatedTestUser = await User.findOne({
      _id: testUsers[1]._id,
    })
      .select("userType")
      .lean();

    expect(updatedTestUser!.userType).toEqual("BLOCKED");
  });
});
