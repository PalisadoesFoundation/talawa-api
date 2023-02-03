import "dotenv/config";
import { Document, Types } from "mongoose";
import { Interface_User, User } from "../../../src/models";
import { MutationUpdateUserProfileArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { updateUserProfile as updateUserProfileResolver } from "../../../src/resolvers/Mutation/updateUserProfile";
import { USER_NOT_FOUND, USER_NOT_FOUND_MESSAGE } from "../../../src/constants";
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
  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

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

  it(`throws NotFoundError if no user exists with _id === context.userId // IN_PRODUCTION=true`, async () => {
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

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
          IN_PRODUCTION: true,
        };
      });
      const { updateUserProfile: updateUserProfileResolverUserError } =
        await import("../../../src/resolvers/Mutation/updateUserProfile");
      await updateUserProfileResolverUserError?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(`Translated ${USER_NOT_FOUND_MESSAGE}`);
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

  it(`throws ConflictError if args.data.email is already registered for another user'// IN_PRODUCTION=true `, async () => {
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

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
          IN_PRODUCTION: true,
        };
      });
      const { updateUserProfile: updateUserProfileResolverEmailError } =
        await import("../../../src/resolvers/Mutation/updateUserProfile");
      await updateUserProfileResolverEmailError?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith("email.alreadyExists");
      expect(error.message).toEqual(`Translated ${"email.alreadyExists"}`);
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

  it(`When Image is given, updates current user's user object and returns the object`, async () => {
    const uploadImage = await import("../../../src/utilities");

    const spy = vi
      .spyOn(uploadImage, "uploadImage")
      .mockImplementationOnce(async () => {
        return {
          newImagePath: "newImagePath",
          imageAlreadyInDbPath: "imageAlreadyInDbPath",
        };
      });

    const args: MutationUpdateUserProfileArgs = {
      data: {
        email: `email${nanoid().toLowerCase()}@gmail.com`,
        firstName: "newFirstName",
        lastName: "newLastName",
      },
      file: "newImageFile.png",
    };

    const context = {
      userId: testUser._id,
    };

    const { updateUserProfile: updateUserProfileResolverWImage } = await import(
      "../../../src/resolvers/Mutation/updateUserProfile"
    );

    const updateUserProfilePayload = await updateUserProfileResolverWImage?.(
      {},
      args,
      context
    );
    expect(spy).toHaveBeenCalledTimes(1);
    expect(updateUserProfilePayload).toEqual({
      ...testUser.toObject(),
      email: args.data?.email,
      firstName: "newFirstName",
      lastName: "newLastName",
      image: "imageAlreadyInDbPath",
    });
  });

  it(`When Image is given, updates current user's user object and returns the object when only email is given`, async () => {
    const uploadImage = await import("../../../src/utilities");

    const spy = vi
      .spyOn(uploadImage, "uploadImage")
      .mockImplementationOnce(async () => {
        return {
          newImagePath: "newImagePath",
          imageAlreadyInDbPath: "imageAlreadyInDbPath",
        };
      });

    const args: MutationUpdateUserProfileArgs = {
      data: {
        email: `email${nanoid().toLowerCase()}@gmail.com`,
      },
      file: "newImageFile.png",
    };

    const context = {
      userId: testUser._id,
    };

    const { updateUserProfile: updateUserProfileResolverWImage } = await import(
      "../../../src/resolvers/Mutation/updateUserProfile"
    );

    const updateUserProfilePayload = await updateUserProfileResolverWImage?.(
      {},
      args,
      context
    );

    expect(spy).toHaveBeenCalledTimes(1);
    expect(updateUserProfilePayload).toEqual({
      ...testUser.toObject(),
      email: args.data?.email,
      firstName: "newFirstName",
      lastName: "newLastName",
      image: "imageAlreadyInDbPath",
    });
  });

  it(`When Image is given, updates current user's user object and returns the object when only firstName is given`, async () => {
    const uploadImage = await import("../../../src/utilities");

    const spy = vi
      .spyOn(uploadImage, "uploadImage")
      .mockImplementationOnce(async () => {
        return {
          newImagePath: "newImagePath",
          imageAlreadyInDbPath: "imageAlreadyInDbPath",
        };
      });

    const args: MutationUpdateUserProfileArgs = {
      data: {
        firstName: "newFirstName1",
      },
      file: "newImageFile.png",
    };

    const context = {
      userId: testUser._id,
    };

    const { updateUserProfile: updateUserProfileResolverWImage } = await import(
      "../../../src/resolvers/Mutation/updateUserProfile"
    );

    const updateUserProfilePayload = await updateUserProfileResolverWImage?.(
      {},
      args,
      context
    );

    const testUserobj = await User.findById({ _id: testUser.id });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(updateUserProfilePayload).toEqual({
      ...testUser.toObject(),
      email: testUserobj?.email,
      firstName: "newFirstName1",
      lastName: testUserobj?.lastName,
      image: "imageAlreadyInDbPath",
    });
  });

  it(`When Image is given, updates current user's user object and returns the object when only lastName is given`, async () => {
    const uploadImage = await import("../../../src/utilities");

    const spy = vi
      .spyOn(uploadImage, "uploadImage")
      .mockImplementationOnce(async () => {
        return {
          newImagePath: "newImagePath",
          imageAlreadyInDbPath: "imageAlreadyInDbPath",
        };
      });

    const args: MutationUpdateUserProfileArgs = {
      data: {
        lastName: "newLastName1",
      },
      file: "newImageFile.png",
    };

    const context = {
      userId: testUser._id,
    };

    const { updateUserProfile: updateUserProfileResolverWImage } = await import(
      "../../../src/resolvers/Mutation/updateUserProfile"
    );

    const updateUserProfilePayload = await updateUserProfileResolverWImage?.(
      {},
      args,
      context
    );

    const testUserobj = await User.findById({ _id: testUser.id });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(updateUserProfilePayload).toEqual({
      ...testUser.toObject(),
      email: testUserobj?.email,
      firstName: testUserobj?.firstName,
      lastName: "newLastName1",
      image: "imageAlreadyInDbPath",
    });
  });

  it(`When Image is given, updates current user's user object and returns the object when only Image is not in DB path`, async () => {
    const uploadImage = await import("../../../src/utilities");

    const spy = vi
      .spyOn(uploadImage, "uploadImage")
      .mockImplementationOnce(async () => {
        return {
          newImagePath: "newImagePath",
          imageAlreadyInDbPath: undefined,
        };
      });

    const args: MutationUpdateUserProfileArgs = {
      data: {},
      file: "newImageFile.png",
    };

    const context = {
      userId: testUser._id,
    };

    const { updateUserProfile: updateUserProfileResolverWImage } = await import(
      "../../../src/resolvers/Mutation/updateUserProfile"
    );

    const updateUserProfilePayload = await updateUserProfileResolverWImage?.(
      {},
      args,
      context
    );

    const testUserobj = await User.findById({ _id: testUser.id });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(updateUserProfilePayload).toEqual({
      ...testUser.toObject(),
      email: testUserobj?.email,
      firstName: testUserobj?.firstName,
      lastName: "newLastName1",
      image: "newImagePath",
    });
  });
});
