import "dotenv/config";
import { Document, Types } from "mongoose";
import { Interface_User, User } from "../../../src/models";
import { MutationUpdateUserProfileArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { updateUserProfile as updateUserProfileResolver } from "../../../src/resolvers/Mutation/updateUserProfile";
import { USER_NOT_FOUND } from "../../../src/constants";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUser: Interface_User & Document<any, any, Interface_User>;

beforeAll(async () => {
  await connect();

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> updateUserProfile", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationUpdateUserProfileArgs = {
        data: {},
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await updateUserProfileResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws ConflictError if args.data.email is already registered for another user'`, async () => {
    try {
      const args: MutationUpdateUserProfileArgs = {
        data: {
          email: testUser.email,
        },
      };

      const context = {
        userId: testUser._id,
      };

      await updateUserProfileResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual("Email already exists");
    }
  });

  it(`updates current user's user object when any single argument(email) is given w/0 changing other fields `, async () => {
    const args: MutationUpdateUserProfileArgs = {
      data: {
        email: `email${nanoid().toLowerCase()}@gmail.com`,
      },
    };

    const context = {
      userId: testUser._id,
    };

    const updateUserProfilePayload = await updateUserProfileResolver?.(
      {},
      args,
      context
    );

    expect(updateUserProfilePayload).toEqual({
      ...testUser.toObject(),
      email: args.data?.email,
      firstName: "firstName",
      lastName: "lastName",
    });
  });

  it(`updates current user's user object when any single argument(firstName) is given w/0 changing other fields `, async () => {
    const args: MutationUpdateUserProfileArgs = {
      data: {
        firstName: "newFirstName",
      },
    };

    const context = {
      userId: testUser._id,
    };

    const updateUserProfilePayload = await updateUserProfileResolver?.(
      {},
      args,
      context
    );

    const testUserobj = await User.findById({ _id: testUser.id });

    expect(updateUserProfilePayload).toEqual({
      ...testUser.toObject(),
      email: testUserobj?.email,
      firstName: args.data?.firstName,
      lastName: testUser.lastName,
    });
  });

  it(`updates current user's user object when any single argument(LastName) is given w/0 changing other fields `, async () => {
    const args: MutationUpdateUserProfileArgs = {
      data: {
        lastName: "newLastName",
      },
    };

    const context = {
      userId: testUser._id,
    };

    const updateUserProfilePayload = await updateUserProfileResolver?.(
      {},
      args,
      context
    );

    const testUserobj = await User.findById({ _id: testUser.id });

    expect(updateUserProfilePayload).toEqual({
      ...testUser.toObject(),
      email: testUserobj?.email,
      firstName: testUserobj?.firstName,
      lastName: args.data?.lastName,
    });
  });

  it(`updates current user's user object and returns the object`, async () => {
    const args: MutationUpdateUserProfileArgs = {
      data: {
        email: `email${nanoid().toLowerCase()}@gmail.com`,
        firstName: "newFirstName",
        lastName: "newLastName",
      },
    };

    const context = {
      userId: testUser._id,
    };

    const updateUserProfilePayload = await updateUserProfileResolver?.(
      {},
      args,
      context
    );

    expect(updateUserProfilePayload).toEqual({
      ...testUser.toObject(),
      email: args.data?.email,
      firstName: "newFirstName",
      lastName: "newLastName",
    });
  });
});
