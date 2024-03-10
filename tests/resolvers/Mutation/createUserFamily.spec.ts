import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationCreateUserFamilyArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  LENGTH_VALIDATION_ERROR,
  USER_FAMILY_MIN_MEMBERS_ERROR_CODE,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_AUTHORIZED_SUPERADMIN,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { AppUserProfile } from "../../../src/models";
import { createTestUserFunc as createTestUser } from "../../helpers/user";
import type { TestUserType } from "../../helpers/userAndUserFamily";
import { createTestUserFunc } from "../../helpers/userAndUserFamily";

let testUser: TestUserType;
let testUser2: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultsArray = await createTestUserFunc();
  const secondUser = await createTestUser();

  testUser = resultsArray;
  testUser2 = secondUser;
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createUserFamily", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationCreateUserFamilyArgs = {
        data: {
          title: "title",
          userIds: [testUser?._id, testUser2?._id],
        },
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      const { createUserFamily: createUserFamilyResolver } = await import(
        "../../../src/resolvers/Mutation/createUserFamily"
      );

      await createUserFamilyResolver?.({}, args, context);
    } catch (error) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws Not Authorized error if user is not a super admin`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => message);
    try {
      const args: MutationCreateUserFamilyArgs = {
        data: {
          title: "title",
          userIds: [testUser?._id, testUser2?._id],
        },
      };

      const context = {
        userId: testUser2?._id,
      };

      const { createUserFamily: createUserFamilyResolver } = await import(
        "../../../src/resolvers/Mutation/createUserFamily"
      );

      await createUserFamilyResolver?.({}, args, context);
    } catch (error) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE);
      expect((error as Error).message).toEqual(
        `${USER_NOT_AUTHORIZED_SUPERADMIN.MESSAGE}`,
      );
    }
  });

  it(`throws String Length Validation error if name is greater than 256 characters`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => message);
    try {
      const args: MutationCreateUserFamilyArgs = {
        data: {
          title:
            "JWQPfpdkGGGKyryb86K4YN85nDj4m4F7gEAMBbMXLax73pn2okV6kpWY0EYO0XSlUc0fAlp45UCgg3s6mqsRYF9FOlzNIDFLZ1rd03Z17cdJRuvBcAmbC0imyqGdXHGDUQmVyOjDkaOLAvjhB5uDeuEqajcAPTcKpZ6LMpigXuqRAd0xGdPNXyITC03FEeKZAjjJL35cSIUeMv5eWmiFlmmm70FU1Bp6575zzBtEdyWPLflcA2GpGmmf4zvT7nfgN3NIkwQIhk9OwP8dn75YYczcYuUzLpxBu1Lyog77YlAj5DNdTIveXu9zHeC6V4EEUcPQtf1622mhdU3jZNMIAyxcAG4ErtztYYRqFs0ApUxXiQI38rmiaLcicYQgcOxpmFvqRGiSduiCprCYm90CHWbQFq4w2uhr8HhR3r9HYMIYtrRyO6C3rPXaQ7otpjuNgE0AKI57AZ4nGG1lvNwptFCY60JEndSLX9Za6XP1zkVRLaMZArQNl",
          userIds: [testUser?._id, testUser2?._id],
        },
      };
      const context = {
        userId: testUser?._id,
      };

      const { createUserFamily: createUserFamilyResolver } = await import(
        "../../../src/resolvers/Mutation/createUserFamily"
      );

      await createUserFamilyResolver?.({}, args, context);
    } catch (error) {
      expect(spy).toHaveBeenCalledWith(
        `${LENGTH_VALIDATION_ERROR.MESSAGE} 256 characters in name`,
      );
      expect((error as Error).message).toEqual(
        `${LENGTH_VALIDATION_ERROR.MESSAGE} 256 characters in name`,
      );
    }
  });

  it(`throws InputValidationError if userIds array has fewer than 2 members`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => message);
    try {
      const args: MutationCreateUserFamilyArgs = {
        data: {
          title: "title",
          userIds: [testUser?._id],
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { createUserFamily: createUserFamilyResolver } = await import(
        "../../../src/resolvers/Mutation/createUserFamily"
      );

      await createUserFamilyResolver?.({}, args, context);
    } catch (error) {
      expect(spy).toHaveBeenCalledWith(
        USER_FAMILY_MIN_MEMBERS_ERROR_CODE.MESSAGE,
      );
      expect((error as Error).message).toEqual(
        `${USER_FAMILY_MIN_MEMBERS_ERROR_CODE.MESSAGE}`,
      );
    }
  });

  it(`creates the user Family and returns it`, async () => {
    const args: MutationCreateUserFamilyArgs = {
      data: {
        title: "title",
        userIds: [testUser2?._id, testUser?._id],
      },
    };

    const context = {
      userId: testUser?.id,
    };

    const { createUserFamily: createUserFamilyResolver } = await import(
      "../../../src/resolvers/Mutation/createUserFamily"
    );

    const createUserFamilyPayload = await createUserFamilyResolver?.(
      {},
      args,
      context,
    );

    expect(createUserFamilyPayload).toEqual(
      expect.objectContaining({
        title: "title",
      }),
    );
  });
  it("throws an error if the user does not have appUserProfile", async () => {
    await AppUserProfile.deleteOne({
      userId: testUser?._id,
    });
    const args: MutationCreateUserFamilyArgs = {
      data: {
        title: "title",
        userIds: [testUser2?._id, testUser?._id],
      },
    };
    const context = {
      userId: testUser?._id,
    };
    const { createUserFamily: createUserFamilyResolver } = await import(
      "../../../src/resolvers/Mutation/createUserFamily"
    );
    try {
      await createUserFamilyResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
});
