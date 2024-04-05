import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { UserFamily } from "../../../src/models/userFamily";
import type { MutationRemoveUserFamilyArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  USER_FAMILY_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import type {
  TestUserFamilyType,
  TestUserType,
} from "../../helpers/userAndUserFamily";
import { createTestUserFunc } from "../../helpers/userAndUserFamily";
import { AppUserProfile } from "../../../src/models";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUsers: TestUserType[];
let testUserFamily: TestUserFamilyType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const tempUser1 = await createTestUserFunc();
  const tempUser2 = await createTestUserFunc();
  testUsers = [tempUser1, tempUser2];

  testUserFamily = await UserFamily.create({
    title: "Family",
    admins: [tempUser1, tempUser2],
    creator: tempUser1,
    users: [tempUser1, tempUser2],
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> removeUserFamily", () => {
  afterEach(() => {
    vi.resetAllMocks();
    vi.doMock("../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationRemoveUserFamilyArgs = {
        familyId: testUserFamily?._id,
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      const { removeUserFamily: removeUserFamilyResolver } = await import(
        "../../../src/resolvers/Mutation/removeUserFamily"
      );

      await removeUserFamilyResolver?.({}, args, context);
    } catch (error) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws NotFoundError if no user family exists with _id === args.familyId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationRemoveUserFamilyArgs = {
        familyId: testUserFamily?._id,
      };

      const context = {
        userId: testUsers[1]?._id,
      };

      const { removeUserFamily: removeUserFamilyResolver } = await import(
        "../../../src/resolvers/Mutation/removeUserFamily"
      );

      await removeUserFamilyResolver?.({}, args, context);
    } catch (error) {
      expect(spy).toHaveBeenCalledWith(USER_FAMILY_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_FAMILY_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws User is not SUPERADMIN error if current user is with _id === context.userId is not a  SUPERADMIN`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => message);

    try {
      const args: MutationRemoveUserFamilyArgs = {
        familyId: testUserFamily?.id,
      };

      const context = {
        userId: testUsers[0]?.id,
      };

      const { removeUserFamily: removeUserFamilyResolver } = await import(
        "../../../src/resolvers/Mutation/removeUserFamily"
      );

      await removeUserFamilyResolver?.({}, args, context);
    } catch (error) {
      expect(spy).toHaveBeenCalledWith(USER_FAMILY_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `${USER_FAMILY_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it("throws user not found error if current user profile is not found", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => message);

    try {
      const args: MutationRemoveUserFamilyArgs = {
        familyId: testUserFamily?.id,
      };

      await AppUserProfile.deleteOne({
        userId: testUsers[0]?.id,
      });

      const context = {
        userId: testUsers[0]?.id,
      };

      const { removeUserFamily: removeUserFamilyResolver } = await import(
        "../../../src/resolvers/Mutation/removeUserFamily"
      );

      await removeUserFamilyResolver?.({}, args, context);
    } catch (error) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });
});
