import "dotenv/config";
import { Document, Types } from "mongoose";
import { Interface_User, User } from "../../../src/models";
import { MutationUpdateUserProfileArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import * as uploadEncodedImage from "../../../src/utilities/encodedImageStorage/uploadEncodedImage";
import { updateUserProfile as updateUserProfileResolver } from "../../../src/resolvers/Mutation/updateUserProfile";
import {
  EMAIL_ALREADY_EXISTS_ERROR,
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

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testUser: Interface_User & Document<any, any, Interface_User>;

vi.mock("../../utilities/uploadEncodedImage", () => ({
  uploadEncodedImage: vi.fn(),
}));
const email = `email${nanoid().toLowerCase()}@gmail.com`;
beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });
  const testUser2 = await User.create({
    email: email,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });
  testUser2.save();
  testUser.save();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.doUnmock("../../../src/constants");
  vi.resetModules();
});

describe("resolvers -> Mutation -> updateUserProfile", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateUserProfileArgs = {
        data: {},
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { updateUserProfile: updateUserProfileResolver } = await import(
        "../../../src/resolvers/Mutation/updateUserProfile"
      );

      await updateUserProfileResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateUserProfileArgs = {
        data: {},
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { updateUserProfile: updateUserProfileResolverUserError } =
        await import("../../../src/resolvers/Mutation/updateUserProfile");

      await updateUserProfileResolverUserError?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws ConflictError if args.data.email is already registered for another user`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateUserProfileArgs = {
        data: {
          email: email,
        },
      };

      const context = {
        userId: testUser._id,
      };

      const { updateUserProfile: updateUserProfileResolver } = await import(
        "../../../src/resolvers/Mutation/updateUserProfile"
      );

      await updateUserProfileResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(EMAIL_ALREADY_EXISTS_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${EMAIL_ALREADY_EXISTS_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws ConflictError if args.data.email is already registered for another user`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateUserProfileArgs = {
        data: {
          email: testUser.email,
        },
      };

      const context = {
        userId: testUser._id,
      };

      const { updateUserProfile: updateUserProfileResolverEmailError } =
        await import("../../../src/resolvers/Mutation/updateUserProfile");

      await updateUserProfileResolverEmailError?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(EMAIL_ALREADY_EXISTS_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${EMAIL_ALREADY_EXISTS_ERROR.MESSAGE}`
      );
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

  it("When Image is give updates the current user's object with the uploaded image and returns it", async () => {
    const args: MutationUpdateUserProfileArgs = {
      data: {
        email: `email${nanoid().toLowerCase()}@gmail.com`,
        firstName: "newFirstName",
        lastName: "newLastName",
      },
      file: "newImageFile.png",
    };

    vi.spyOn(uploadEncodedImage, "uploadEncodedImage").mockImplementation(
      async (encodedImageURL: string) => encodedImageURL
    );

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
      image: "newImageFile.png",
    });
  });
  it("When Image is give updates the current user's object with the uploaded image and returns it", async () => {
    const args: MutationUpdateUserProfileArgs = {
      data: {},
      file: "newImageFile.png",
    };

    vi.spyOn(uploadEncodedImage, "uploadEncodedImage").mockImplementation(
      async (encodedImageURL: string) => encodedImageURL
    );

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
      email: updateUserProfilePayload?.email,
      firstName: "newFirstName",
      lastName: "newLastName",
      image: "newImageFile.png",
    });
  });
});
