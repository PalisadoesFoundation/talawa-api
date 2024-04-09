import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { UserFamily } from "../../../src/models/userFamily";
import type { MutationAddUserToUserFamilyArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  USER_ALREADY_MEMBER_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_FAMILY_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type {
  TestUserType,
  TestUserFamilyType,
} from "../../helpers/userAndUserFamily";

import { createTestUserAndUserFamily } from "../../helpers/userAndUserFamily";

let testUser: TestUserType;
let testUserFamily: TestUserFamilyType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultsArray = await createTestUserAndUserFamily();
  testUser = resultsArray[0];
  testUserFamily = resultsArray[1];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolver -> mutation -> addUserToUserFamily", () => {
  afterAll(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no user Family exists with _id === args.familyId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => message);
    try {
      const args: MutationAddUserToUserFamilyArgs = {
        familyId: new Types.ObjectId().toString(),
        userId: testUser?.id,
      };

      const context = {
        userId: testUser?.id,
      };

      const { addUserToUserFamily } = await import(
        "../../../src/resolvers/Mutation/addUserToUserFamily"
      );
      await addUserToUserFamily?.({}, args, context);
    } catch (error) {
      expect(spy).toBeCalledWith(USER_FAMILY_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `${USER_FAMILY_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => message);
    try {
      const args: MutationAddUserToUserFamilyArgs = {
        familyId: testUserFamily?._id,
        userId: new Types.ObjectId().toString(),
      };

      const context = {
        userId: new Types.ObjectId().toString(), //this is a random value which does not exist in the database
      };

      const { addUserToUserFamily } = await import(
        "../../../src/resolvers/Mutation/addUserToUserFamily"
      );
      await addUserToUserFamily?.({}, args, context);
    } catch (error) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws ConflictError if user with _id === args.userId is already a member 
  of user family group with _id === args.familyId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => message);
    try {
      const args: MutationAddUserToUserFamilyArgs = {
        familyId: testUserFamily?._id,
        userId: testUser?.id,
      };

      const context = {
        userId: testUser?._id,
      };

      const { addUserToUserFamily } = await import(
        "../../../src/resolvers/Mutation/addUserToUserFamily"
      );
      await addUserToUserFamily?.({}, args, context);
    } catch (error) {
      expect(spy).toBeCalledWith(USER_ALREADY_MEMBER_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_ALREADY_MEMBER_ERROR.MESSAGE,
      );
    }
  });

  it(`add the user family with _id === args.familyId and returns it`, async () => {
    await UserFamily.updateOne(
      {
        _id: testUserFamily?._id,
      },
      {
        $set: {
          users: [],
        },
      },
    );

    const args: MutationAddUserToUserFamilyArgs = {
      familyId: testUserFamily?.id,
      userId: testUser?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    const { addUserToUserFamily } = await import(
      "../../../src/resolvers/Mutation/addUserToUserFamily"
    );
    const addUserToUserFamilyPayload = await addUserToUserFamily?.(
      {},
      args,
      context,
    );
    expect(addUserToUserFamilyPayload?._id).toEqual(testUserFamily?._id);
    expect(addUserToUserFamilyPayload?.users).toEqual([testUser?._id]);
  });
});
