import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
  Interface_Organization,
} from "../../../src/models";
import { MutationSignUpArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import {
  androidFirebaseOptions,
  iosFirebaseOptions,
} from "../../../src/config";
import {
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_MESSAGE,
} from "../../../src/constants";
import { nanoid } from "nanoid";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  vi,
  expect,
  afterEach,
} from "vitest";

let testUser: Interface_User & Document<any, any, Interface_User>;
let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;

beforeAll(async () => {
  await connect("TALAWA_TESTING_DB");

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });

  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser._id,
    admins: [testUser._id],
    members: [testUser._id],
    visibleInSearch: true,
  });

  await User.updateOne(
    {
      _id: testUser._id,
    },
    {
      $set: {
        createdOrganizations: [testOrganization._id],
        adminFor: [testOrganization._id],
        joinedOrganizations: [testOrganization._id],
      },
    }
  );
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> signUp", () => {
  afterEach(async () => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it(`throws ConflictError if a user already with email === args.data.email already exists`, async () => {
    try {
      const args: MutationSignUpArgs = {
        data: {
          email: testUser.email,
          firstName: "firstName",
          lastName: "lastName",
          password: "password",
          appLanguageCode: "en",
          organizationUserBelongsToId: undefined,
          userType: "USER",
        },
      };
      const { signUp: signUpResolver } = await import(
        "../../../src/resolvers/Mutation/signUp"
      );

      await signUpResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual("Email already exists");
    }
  });

  it(`creates the user and returns the created user with accessToken, refreshToken,
  androidFirebaseOptions, iosFirebaseOptions`, async () => {
    const email = `email${nanoid().toLowerCase()}@gmail.com`;

    const args: MutationSignUpArgs = {
      data: {
        email,
        firstName: "firstName",
        lastName: "lastName",
        password: "password",
        appLanguageCode: "en",
        organizationUserBelongsToId: undefined,
        userType: "USER",
      },
    };
    const { signUp: signUpResolver } = await import(
      "../../../src/resolvers/Mutation/signUp"
    );

    const signUpPayload = await signUpResolver?.({}, args, {});

    const createdUser = await User.findOne({
      email,
    })
      .select("-password")
      .lean();

    expect({
      user: signUpPayload?.user,
      androidFirebaseOptions: signUpPayload?.androidFirebaseOptions,
      iosFirebaseOptions: signUpPayload?.iosFirebaseOptions,
    }).toEqual({
      user: createdUser,
      androidFirebaseOptions,
      iosFirebaseOptions,
    });

    expect(typeof signUpPayload?.accessToken).toEqual("string");
    expect(signUpPayload?.accessToken.length).toBeGreaterThan(1);

    expect(typeof signUpPayload?.refreshToken).toEqual("string");
    expect(signUpPayload?.refreshToken.length).toBeGreaterThan(1);
  });

  it(`throws NotFoundError if no organization exists with _id === args.data.organizationUserBelongsToId`, async () => {
    try {
      const email = `email${nanoid().toLowerCase()}@gmail.com`;

      const args: MutationSignUpArgs = {
        data: {
          email,
          firstName: "firstName",
          lastName: "lastName",
          password: "password",
          appLanguageCode: "en",
          organizationUserBelongsToId: Types.ObjectId().toString(),
          userType: "USER",
        },
      };
      const { signUp: signUpResolver } = await import(
        "../../../src/resolvers/Mutation/signUp"
      );

      await signUpResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND);
    }
  });

  it(`creates the user with provided organizationUserBelongsToId and returns the
  created user  with accessToken, refreshToken, androidFirebaseOptions,
  iosFirebaseOptions`, async () => {
    const email = `email${nanoid().toLowerCase()}@gmail.com`;

    const args: MutationSignUpArgs = {
      data: {
        email,
        firstName: "firstName",
        lastName: "lastName",
        password: "password",
        appLanguageCode: "en",
        organizationUserBelongsToId: testOrganization.id,
        userType: "USER",
      },
    };
    const { signUp: signUpResolver } = await import(
      "../../../src/resolvers/Mutation/signUp"
    );

    const signUpPayload = await signUpResolver?.({}, args, {});

    const createdUser = await User.findOne({
      email,
    })
      .select("-password")
      .lean();

    expect({
      user: signUpPayload?.user,
      androidFirebaseOptions: signUpPayload?.androidFirebaseOptions,
      iosFirebaseOptions: signUpPayload?.iosFirebaseOptions,
    }).toEqual({
      user: createdUser,
      androidFirebaseOptions,
      iosFirebaseOptions,
    });

    expect(typeof signUpPayload?.accessToken).toEqual("string");
    expect(signUpPayload?.accessToken.length).toBeGreaterThan(1);

    expect(typeof signUpPayload?.refreshToken).toEqual("string");
    expect(signUpPayload?.refreshToken.length).toBeGreaterThan(1);
  });
  it(`when uploadImage is called with newFile `, async () => {
    const utilities = await import("../../../src/utilities");
    const newImageFile = {
      filename: "testImage.png",
      createReadStream: {},
    };
    const returnImageFile = {
      newImagePath: "/testImage",
      imageAlreadyInDbPath: "",
    };
    const uploadImageSpy = vi
      .spyOn(utilities, "uploadImage")
      .mockImplementation(() => {
        return Promise.resolve(returnImageFile);
      });

    const email = `email${nanoid().toLowerCase()}@gmail.com`;

    const args: MutationSignUpArgs = {
      data: {
        email,
        firstName: "firstName",
        lastName: "lastName",
        password: "password",
        appLanguageCode: "en",
        organizationUserBelongsToId: testOrganization.id,
        userType: "USER",
      },
      file: newImageFile,
    };
    const { signUp: signUpResolver } = await import(
      "../../../src/resolvers/Mutation/signUp"
    );

    await signUpResolver?.({}, args, {});
    await User.findOne({
      email,
    })
      .select("-password")
      .lean();

    expect(uploadImageSpy).toBeCalledWith(newImageFile, null);
  });
  it(`when image file is already exists in the database `, async () => {
    const utilities = await import("../../../src/utilities");
    const newImageFile = {
      filename: "testImage.png",
      createReadStream: {},
    };
    const returnImageFile = {
      newImagePath: "/testImage",
      imageAlreadyInDbPath: "/testImage",
    };
    const uploadImageSpy = vi
      .spyOn(utilities, "uploadImage")
      .mockImplementation(() => {
        return Promise.resolve(returnImageFile);
      });

    const email = `email${nanoid().toLowerCase()}@gmail.com`;

    const args: MutationSignUpArgs = {
      data: {
        email,
        firstName: "firstName",
        lastName: "lastName",
        password: "password",
        appLanguageCode: "en",
        organizationUserBelongsToId: testOrganization.id,
        userType: "USER",
      },
      file: newImageFile,
    };
    const { signUp: signUpResolver } = await import(
      "../../../src/resolvers/Mutation/signUp"
    );

    await signUpResolver?.({}, args, {});
    await User.findOne({
      email,
    })
      .select("-password")
      .lean();

    expect(uploadImageSpy).toHaveReturnedWith(returnImageFile);
  });
});

describe("resolvers -> Mutation -> signUp - [IN_PRODUCTION === TRUE]", () => {
  afterEach(async () => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it(`throws ConflictError  message if a user already with email === args.data.email already exists when [IN_PRODUCTION === TRUE]`, async () => {
    const EMAIL_MESSAGE = "email.alreadyExists";
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationSignUpArgs = {
        data: {
          email: testUser.email,
          firstName: "firstName",
          lastName: "lastName",
          password: "password",
          appLanguageCode: "en",
          organizationUserBelongsToId: undefined,
          userType: "USER",
        },
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
      const { signUp: signUpResolver } = await import(
        "../../../src/resolvers/Mutation/signUp"
      );

      await signUpResolver?.({}, args, {});
    } catch (error: any) {
      expect(spy).toBeCalledWith(EMAIL_MESSAGE);
      expect(error.message).toEqual(EMAIL_MESSAGE);
    }
  });
  it(`throws NotFoundError message if no organization exists with _id === args.data.organizationUserBelongsToId when [IN_PRODUCTION === TRUE]`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const email = `email${nanoid().toLowerCase()}@gmail.com`;

      const args: MutationSignUpArgs = {
        data: {
          email,
          firstName: "firstName",
          lastName: "lastName",
          password: "password",
          appLanguageCode: "en",
          organizationUserBelongsToId: Types.ObjectId().toString(),
          userType: "USER",
        },
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
      const { signUp: signUpResolver } = await import(
        "../../../src/resolvers/Mutation/signUp"
      );

      await signUpResolver?.({}, args, {});
    } catch (error: any) {
      expect(spy).toBeCalledWith(ORGANIZATION_NOT_FOUND_MESSAGE);
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_MESSAGE);
    }
  });
});
