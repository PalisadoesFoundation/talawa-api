import "dotenv/config";
import mongoose, { Types } from "mongoose";
import { UserFamily } from "../../../src/models/userFamily";
import type { MutationRemoveUserFromUserFamilyArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  ADMIN_REMOVING_ADMIN,
  ADMIN_REMOVING_CREATOR,
  USER_FAMILY_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_REMOVING_SELF,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { createTestUserFunc } from "../../helpers/userAndUserFamily";
import type {
  TestUserFamilyType,
  TestUserType,
} from "../../helpers/userAndUserFamily";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUsers: TestUserType[];
let testUserFamily: TestUserFamilyType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const tempUser1 = await createTestUserFunc();
  const tempUser2 = await createTestUserFunc();
  const tempUser3 = await createTestUserFunc();
  const tempUser4 = await createTestUserFunc();
  const tempUser5 = await createTestUserFunc();
  testUsers = [tempUser1, tempUser2, tempUser3, tempUser4, tempUser5];
  testUserFamily = await UserFamily.create({
    title: "title",
    users: [
      testUsers[0]?._id,
      testUsers[1]?._id,
      testUsers[2]?._id,
      testUsers[4]?._id,
    ],
    admins: [testUsers[2]?._id, testUsers[1]?._id],
    creator: testUsers[2]?._id,
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolver -> Mutation -> removerUserFromUserFamily", () => {
  it("should throw user not found error when user with _id === args.userId does not exist", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);
    try {
      const args: MutationRemoveUserFromUserFamilyArgs = {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        familyId: testUserFamily!.id,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        userId: new mongoose.Types.ObjectId()._id!.toString(),
      };

      const context = {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        userId: testUsers[1]?.id,
      };

      const { removeUserFromUserFamily: removeUserFromUserFamilyResolver } =
        await import(
          "../../../src/resolvers/Mutation/removeUserFromUserFamily"
        );

      await removeUserFromUserFamilyResolver?.({}, args, context);
      expect.fail("Error not caught!");
    } catch (error) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws NotFoundError if no user family exists with _id === args.familyId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationRemoveUserFromUserFamilyArgs = {
        familyId: Types.ObjectId().toString(),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        userId: testUsers[4]?._id,
      };

      const context = {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        userId: testUsers[0]?._id,
      };

      const { removeUserFromUserFamily: removeUserFromUserFamilyResolver } =
        await import(
          "../../../src/resolvers/Mutation/removeUserFromUserFamily"
        );

      await removeUserFromUserFamilyResolver?.({}, args, context);
      expect.fail("Error not caught!");
    } catch (error) {
      expect(spy).toBeCalledWith(USER_FAMILY_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `${USER_FAMILY_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws UnauthorizedError if users field of user family with _id === args.familyId
    does not contain user with _id === args.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationRemoveUserFromUserFamilyArgs = {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        familyId: testUserFamily?.id,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        userId: testUsers[3]?._id,
      };

      const context = {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        userId: testUsers[2]?.id,
      };

      const { removeUserFromUserFamily: removeUserFromUserFamilyResolver } =
        await import(
          "../../../src/resolvers/Mutation/removeUserFromUserFamily"
        );

      await removeUserFromUserFamilyResolver?.({}, args, context);
      expect.fail("Error not caught!");
    } catch (error) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it("should throw member not found error when user with _id === args.data.userId does not exist in the user Family", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);
    try {
      const args: MutationRemoveUserFromUserFamilyArgs = {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        familyId: testUserFamily?.id,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        userId: testUsers[3]?._id,
      };

      const context = {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        userId: testUsers[2]?.id,
      };

      const { removeUserFromUserFamily: removeUserFromUserFamilyResolver } =
        await import(
          "../../../src/resolvers/Mutation/removeUserFromUserFamily"
        );

      await removeUserFromUserFamilyResolver?.({}, args, context);
      expect.fail("Error not caught!");
    } catch (error) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it("should throw admin cannot remove self error when user with _id === args.data.userId === context.userId", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);
    try {
      const args: MutationRemoveUserFromUserFamilyArgs = {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        familyId: testUserFamily?.id,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        userId: testUsers[2]?._id,
      };

      const context = {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        userId: testUsers[2]?.id,
      };

      const { removeUserFromUserFamily: removeUserFromUserFamilyResolver } =
        await import(
          "../../../src/resolvers/Mutation/removeUserFromUserFamily"
        );

      await removeUserFromUserFamilyResolver?.({}, args, context);
      expect.fail("Error not caught!");
    } catch (error) {
      expect(spy).toHaveBeenCalledWith(USER_REMOVING_SELF.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_REMOVING_SELF.MESSAGE}`,
      );
    }
  });

  it("should throw admin cannot remove another admin error when user with _id === args.data.userId is also an admin in the user Family", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);
    try {
      const args: MutationRemoveUserFromUserFamilyArgs = {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        familyId: testUserFamily?.id,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        userId: testUsers[1]?._id,
      };

      const context = {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        userId: testUsers[2]?.id,
      };

      const { removeUserFromUserFamily: removeUserFromUserFamilyResolver } =
        await import(
          "../../../src/resolvers/Mutation/removeUserFromUserFamily"
        );

      await removeUserFromUserFamilyResolver?.({}, args, context);
      expect.fail("Error not caught!");
    } catch (error) {
      expect(spy).toHaveBeenCalledWith(ADMIN_REMOVING_ADMIN.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${ADMIN_REMOVING_ADMIN.MESSAGE}`,
      );
    }
  });

  it("should throw admin cannot remove creator error when user with _id === args.data.userId is the user Family creator in the user Family", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);
    try {
      const args: MutationRemoveUserFromUserFamilyArgs = {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        familyId: testUserFamily?.id,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        userId: testUsers[2]?._id,
      };

      const context = {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        userId: testUsers[1]?.id,
      };

      const { removeUserFromUserFamily: removeUserFromUserFamilyResolver } =
        await import(
          "../../../src/resolvers/Mutation/removeUserFromUserFamily"
        );

      await removeUserFromUserFamilyResolver?.({}, args, context);
      expect.fail("Error not caught!");
    } catch (error) {
      expect(spy).toHaveBeenCalledWith(ADMIN_REMOVING_CREATOR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${ADMIN_REMOVING_CREATOR.MESSAGE}`,
      );
    }
  });

  it("remove that user with _id === args.data.userId from that user Family", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => `Translated ${message}`,
    );
    const args: MutationRemoveUserFromUserFamilyArgs = {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      familyId: testUserFamily?.id,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      userId: testUsers[4]?._id,
    };

    const context = {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      userId: testUsers[2]?.id,
    };

    const { removeUserFromUserFamily: removeUserFromUserFamilyResolver } =
      await import("../../../src/resolvers/Mutation/removeUserFromUserFamily");

    const updatedUserFamily = await removeUserFromUserFamilyResolver?.(
      {},
      args,
      context,
    );

    expect(updatedUserFamily?.users).not.toContain(testUsers[4]?._id);
  });
});
