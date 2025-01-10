import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { AppUserProfile, User } from "../../../src/models";
import type { MutationUpdateUserPasswordArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
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
  INVALID_CREDENTIALS_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { updateUserPassword as updateUserPasswordResolver } from "../../../src/resolvers/Mutation/updateUserPassword";
import { createTestUser, type TestUserType } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;

vi.mock("../../utilities/uploadEncodedImage", () => ({
  uploadEncodedImage: vi.fn(),
}));

let hashedPassword: string;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  hashedPassword = await bcrypt.hash("password", 12);
  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: hashedPassword,
    firstName: "firstName",
    lastName: "lastName",
  });
  await AppUserProfile.create({
    userId: testUser._id,
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.doUnmock("../../../src/constants");
  vi.resetModules();
});

describe("resolvers -> Mutation -> updateUserPassword", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateUserPasswordArgs = {
        data: {
          previousPassword: "abcdefgh",
          newPassword: "abcdabcd",
          confirmNewPassword: "abcdabcd",
        },
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      const { updateUserPassword: updateUserPasswordResolver } = await import(
        "../../../src/resolvers/Mutation/updateUserPassword"
      );

      await updateUserPasswordResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws INVALID Credentials error if previous password and saved password mismatch`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message,
    );

    try {
      const args: MutationUpdateUserPasswordArgs = {
        data: {
          previousPassword: "abcdefgh",
          newPassword: "abcdabcd",
          confirmNewPassword: "abcdabcd",
        },
      };

      const context = {
        userId: testUser?._id,
      };

      const { updateUserPassword: updateUserPasswordResolver } = await import(
        "../../../src/resolvers/Mutation/updateUserPassword"
      );
      await updateUserPasswordResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        INVALID_CREDENTIALS_ERROR.MESSAGE,
      );
    }
  });

  it(`throws INVALID Credentials error if new password and confirm new password mismatch`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message,
    );

    try {
      const args: MutationUpdateUserPasswordArgs = {
        data: {
          previousPassword: "password",
          newPassword: "abcdabcd",
          confirmNewPassword: "abcdabcdefg",
        },
      };

      const context = {
        userId: testUser?._id,
      };

      const { updateUserPassword: updateUserPasswordResolver } = await import(
        "../../../src/resolvers/Mutation/updateUserPassword"
      );

      await updateUserPasswordResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        INVALID_CREDENTIALS_ERROR.MESSAGE,
      );
    }
  });

  it(`throws INVALID Credentials error if new password, confirm new password and previous password are null`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message,
    );

    try {
      const args: MutationUpdateUserPasswordArgs = {
        data: {
          previousPassword: String(null),
          newPassword: String(null),
          confirmNewPassword: String(null),
        },
      };

      const context = {
        userId: testUser?._id,
      };

      const { updateUserPassword: updateUserPasswordResolver } = await import(
        "../../../src/resolvers/Mutation/updateUserPassword"
      );

      await updateUserPasswordResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        INVALID_CREDENTIALS_ERROR.MESSAGE,
      );
    }
  });

  it(`updates current user's user object and returns the object`, async () => {
    const args: MutationUpdateUserPasswordArgs = {
      data: {
        previousPassword: "password",
        newPassword: "abcdabcd",
        confirmNewPassword: "abcdabcd",
      },
    };

    const context = {
      userId: testUser?._id,
    };

    const updateUserPasswordPayload = await updateUserPasswordResolver?.(
      {},
      args,
      context,
    );

    expect(updateUserPasswordPayload).not.toBeNull();
  });
  it("throws error if user does not have appLanguageCode", async () => {
    const newUser = await createTestUser();
    await AppUserProfile.deleteOne({
      userId: newUser?.id,
    });
    const args: MutationUpdateUserPasswordArgs = {
      data: {
        previousPassword: "password",
        newPassword: "abcdabcd",
        confirmNewPassword: "abcdabcd",
      },
    };
    const context = {
      userId: newUser?._id,
    };

    try {
      await updateUserPasswordResolver?.({}, args, context);
    } catch (error: unknown) {
      console.log((error as Error).message);
      // expect(spy).toHaveBeenCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
});
