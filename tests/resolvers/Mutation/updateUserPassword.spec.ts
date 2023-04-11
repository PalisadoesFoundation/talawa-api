import "dotenv/config";
import { Document, Types } from "mongoose";
import { Interface_User, User } from "../../../src/models";
import { MutationUpdateUserPasswordArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { updateUserPassword as updateUserPasswordResolver } from "../../../src/resolvers/Mutation/updateUserPassword";
import {
  INVALID_CREDENTIALS_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { nanoid } from "nanoid";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  vi,
  afterEach,
} from "vitest";
import bcrypt from "bcryptjs";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: Interface_User & Document<any, any, Interface_User>;

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
    appLanguageCode: "en",
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
        userId: Types.ObjectId().toString(),
      };

      const { updateUserPassword: updateUserPasswordResolver } = await import(
        "../../../src/resolvers/Mutation/updateUserPassword"
      );

      await updateUserPasswordResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws INVALID Credentials error if previous password and saved password mismatch`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
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
        userId: testUser._id,
      };

      const { updateUserPassword: updateUserPasswordResolver } = await import(
        "../../../src/resolvers/Mutation/updateUserPassword"
      );

      await updateUserPasswordResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(INVALID_CREDENTIALS_ERROR.MESSAGE);
    }
  });

  it(`throws INVALID Credentials error if new password and confirm new password mismatch`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
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
        userId: testUser._id,
      };

      const { updateUserPassword: updateUserPasswordResolver } = await import(
        "../../../src/resolvers/Mutation/updateUserPassword"
      );

      await updateUserPasswordResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(INVALID_CREDENTIALS_ERROR.MESSAGE);
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
      userId: testUser._id,
    };

    const updateUserPasswordPayload = await updateUserPasswordResolver?.(
      {},
      args,
      context
    );

    expect(updateUserPasswordPayload).not.toBeNull();
  });
});
