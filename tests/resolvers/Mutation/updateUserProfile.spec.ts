import "dotenv/config";
import type mongoose from "mongoose";
import type { Document } from "mongoose";
import { Types } from "mongoose";
import type { InterfaceUser } from "../../../src/models";
import { User } from "../../../src/models";
import type { MutationUpdateUserProfileArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import * as userCache from "../../../src/services/UserCache/deleteUserFromCache";

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
  BASE_URL,
  EMAIL_ALREADY_EXISTS_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { updateUserProfile as updateUserProfileResolver } from "../../../src/resolvers/Mutation/updateUserProfile";
import * as uploadEncodedImage from "../../../src/utilities/encodedImageStorage/uploadEncodedImage";

let MONGOOSE_INSTANCE: typeof mongoose;

type UserDocument = InterfaceUser &
  Document<InterfaceUser, NonNullable<unknown>, InterfaceUser>;
let testUser: UserDocument;
let testUser2: UserDocument;

vi.mock("../../utilities/uploadEncodedImage", () => ({
  uploadEncodedImage: vi.fn(),
}));
const email = `email${nanoid().toLowerCase()}@gmail.com`;
const date = new Date("2002-03-04T18:30:00.000Z");

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  testUser = (await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
    gender: null,
    image: null,
    birthDate: null,
    educationGrade: null,
    employmentStatus: null,
    address: {
      city: null,
      countryCode: null,
      dependentLocality: null,
      line1: null,
      line2: null,
      postalCode: null,
      sortingCode: null,
      state: null,
    },
    maritalStatus: null,
    phone: {
      home: null,
      mobile: null,
      work: null,
    },
  })) as UserDocument;

  testUser2 = (await User.create({
    email: email,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  })) as UserDocument;
  await testUser2.save();
  await testUser.save();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
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
        userId: new Types.ObjectId().toString(),
      };

      const { updateUserProfile: updateUserProfileResolver } = await import(
        "../../../src/resolvers/Mutation/updateUserProfile"
      );

      await updateUserProfileResolver?.({}, args, context);
    } catch (error) {
      if (error instanceof Error) {
        expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
        expect(error.message).toEqual(
          `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
        );
      }
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
        userId: new Types.ObjectId().toString(),
      };

      const { updateUserProfile: updateUserProfileResolverUserError } =
        await import("../../../src/resolvers/Mutation/updateUserProfile");

      await updateUserProfileResolverUserError?.({}, args, context);
    } catch (error) {
      if (error instanceof Error) {
        expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
        expect(error.message).toEqual(
          `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
        );
      }
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
          email: testUser2.email,
        },
      };

      const context = {
        userId: testUser._id,
      };

      const { updateUserProfile: updateUserProfileResolver } = await import(
        "../../../src/resolvers/Mutation/updateUserProfile"
      );

      await updateUserProfileResolver?.({}, args, context);
    } catch (error) {
      if (error instanceof Error) {
        expect(spy).toHaveBeenLastCalledWith(
          EMAIL_ALREADY_EXISTS_ERROR.MESSAGE,
        );
        expect(error.message).toEqual(
          `Translated ${EMAIL_ALREADY_EXISTS_ERROR.MESSAGE}`,
        );
      }
    }
  });

  it(`updates if email not changed by user`, async () => {
    const args: MutationUpdateUserProfileArgs = {
      data: {
        email: testUser.email,
      },
    };

    const context = {
      userId: testUser._id,
    };

    const updateUserProfilePayload = await updateUserProfileResolver?.(
      {},
      args,
      context,
    );

    expect(updateUserProfilePayload).toEqual({
      ...testUser.toObject(),
      image: null,
      updatedAt: expect.anything(),
      createdAt: expect.anything(),
    });
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
      context,
    );

    expect(updateUserProfilePayload).toEqual({
      ...testUser.toObject(),
      email: args.data?.email,
      firstName: "firstName",
      lastName: "lastName",
      image: null,
      updatedAt: expect.anything(),
      createdAt: expect.anything(),
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
      context,
    );

    const testUserobj = await User.findById({ _id: testUser.id });

    expect(updateUserProfilePayload).toEqual({
      ...testUser.toObject(),
      email: testUserobj?.email,
      firstName: args.data?.firstName,
      lastName: testUser.lastName,
      image: null,
      updatedAt: expect.anything(),
      createdAt: expect.anything(),
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
      context,
    );

    const testUserobj = await User.findById({ _id: testUser.id });

    expect(updateUserProfilePayload).toEqual({
      ...testUser.toObject(),
      email: testUserobj?.email,
      firstName: testUserobj?.firstName,
      lastName: args.data?.lastName,
      image: null,
      updatedAt: expect.anything(),
      createdAt: expect.anything(),
    });
  });

  it(`updates current user's user object when any single argument(birthdate) is given w/0 changing other fields `, async () => {
    const args: MutationUpdateUserProfileArgs = {
      data: {
        birthDate: date,
      },
    };

    const context = {
      userId: testUser._id,
      apiRootUrl: BASE_URL,
    };

    const updateUserProfilePayload = await updateUserProfileResolver?.(
      {},
      args,
      context,
    );

    const testUserobj = await User.findById({ _id: testUser.id });

    expect(updateUserProfilePayload).toEqual({
      ...testUser.toObject(),
      email: testUserobj?.email,
      firstName: testUserobj?.firstName,
      lastName: testUserobj?.lastName,
      image: null,
      birthDate: args.data?.birthDate,
      updatedAt: expect.anything(),
      createdAt: expect.anything(),
    });
  });

  it(`updates current user's user object when any single argument(EducationGrade) is given w/0 changing other fields `, async () => {
    const args: MutationUpdateUserProfileArgs = {
      data: {
        educationGrade: "GRADUATE",
      },
    };

    const context = {
      userId: testUser._id,
      apiRootUrl: BASE_URL,
    };

    const updateUserProfilePayload = await updateUserProfileResolver?.(
      {},
      args,
      context,
    );

    const testUserobj = await User.findById({ _id: testUser.id });

    expect(updateUserProfilePayload).toEqual({
      ...testUser.toObject(),
      email: testUserobj?.email,
      firstName: testUserobj?.firstName,
      lastName: testUserobj?.lastName,
      image: null,
      birthDate: date,
      educationGrade: args.data?.educationGrade,
      updatedAt: expect.anything(),
      createdAt: expect.anything(),
    });
  });

  it(`updates current user's user object when any single argument(EmployementStatus) is given w/0 changing other fields `, async () => {
    const args: MutationUpdateUserProfileArgs = {
      data: {
        employmentStatus: "FULL_TIME",
      },
    };

    const context = {
      userId: testUser._id,
      apiRootUrl: BASE_URL,
    };

    const updateUserProfilePayload = await updateUserProfileResolver?.(
      {},
      args,
      context,
    );

    const testUserobj = await User.findById({ _id: testUser.id });

    expect(updateUserProfilePayload).toEqual({
      ...testUser.toObject(),
      email: testUserobj?.email,
      firstName: testUserobj?.firstName,
      lastName: testUserobj?.lastName,
      image: null,
      birthDate: date,
      educationGrade: "GRADUATE",
      employmentStatus: args.data?.employmentStatus,
      updatedAt: expect.anything(),
      createdAt: expect.anything(),
    });
  });

  it(`updates current user's user object when any single argument(Gender) is given w/0 changing other fields `, async () => {
    const args: MutationUpdateUserProfileArgs = {
      data: {
        gender: "FEMALE",
      },
    };

    const context = {
      userId: testUser._id,
      apiRootUrl: BASE_URL,
    };

    const updateUserProfilePayload = await updateUserProfileResolver?.(
      {},
      args,
      context,
    );

    const testUserobj = await User.findById({ _id: testUser.id });

    expect(updateUserProfilePayload).toEqual({
      ...testUser.toObject(),
      email: testUserobj?.email,
      firstName: testUserobj?.firstName,
      lastName: testUserobj?.lastName,
      image: null,
      birthDate: date,
      educationGrade: "GRADUATE",
      employmentStatus: "FULL_TIME",
      gender: args.data?.gender,
      updatedAt: expect.anything(),
      createdAt: expect.anything(),
    });
  });

  it(`updates current user's user object when any single argument(MaritalStatus) is given w/0 changing other fields `, async () => {
    const args: MutationUpdateUserProfileArgs = {
      data: {
        maritalStatus: "SINGLE",
      },
    };

    const context = {
      userId: testUser._id,
      apiRootUrl: BASE_URL,
    };

    const updateUserProfilePayload = await updateUserProfileResolver?.(
      {},
      args,
      context,
    );

    const testUserobj = await User.findById({ _id: testUser.id });

    expect(updateUserProfilePayload).toEqual({
      ...testUser.toObject(),
      email: testUserobj?.email,
      firstName: testUserobj?.firstName,
      lastName: testUserobj?.lastName,
      image: null,
      birthDate: date,
      educationGrade: "GRADUATE",
      employmentStatus: "FULL_TIME",
      gender: "FEMALE",
      maritalStatus: args.data?.maritalStatus,
      updatedAt: expect.anything(),
      createdAt: expect.anything(),
    });
  });

  it(`updates current user's user object when any single argument(PhoneNumber) is given w/0 changing other fields `, async () => {
    const args: MutationUpdateUserProfileArgs = {
      data: {
        phone: {
          home: "020 89024004",
          mobile: "+91 1234567890",
          work: "+31 1234567890",
        },
      },
    };

    const context = {
      userId: testUser._id,
      apiRootUrl: BASE_URL,
    };

    const updateUserProfilePayload = await updateUserProfileResolver?.(
      {},
      args,
      context,
    );

    const testUserobj = await User.findById({ _id: testUser.id });

    expect(updateUserProfilePayload).toEqual({
      ...testUser.toObject(),
      email: testUserobj?.email,
      firstName: testUserobj?.firstName,
      lastName: testUserobj?.lastName,
      image: null,
      birthDate: date,
      educationGrade: "GRADUATE",
      employmentStatus: "FULL_TIME",
      gender: "FEMALE",
      maritalStatus: "SINGLE",
      phone: args.data?.phone,
      updatedAt: expect.anything(),
      createdAt: expect.anything(),
    });
  });

  it(`updates current user's user object when any single argument(address) is given w/0 changing other fields `, async () => {
    const args: MutationUpdateUserProfileArgs = {
      data: {
        address: {
          city: "CityName",
          countryCode: "123",
          dependentLocality: "345",
          line1: "Street ABC",
          line2: "Near XYZ Park",
          postalCode: "45672",
          sortingCode: "234",
          state: "StateName",
        },
      },
    };

    const context = {
      userId: testUser._id,
      apiRootUrl: BASE_URL,
    };

    const updateUserProfilePayload = await updateUserProfileResolver?.(
      {},
      args,
      context,
    );

    const testUserobj = await User.findById({ _id: testUser.id });

    expect(updateUserProfilePayload).toEqual({
      ...testUser.toObject(),
      email: testUserobj?.email,
      firstName: testUserobj?.firstName,
      lastName: testUserobj?.lastName,
      image: null,
      birthDate: date,
      educationGrade: "GRADUATE",
      employmentStatus: "FULL_TIME",
      gender: "FEMALE",
      maritalStatus: "SINGLE",
      address: args.data?.address,
      phone: {
        home: "020 89024004",
        mobile: "+91 1234567890",
        work: "+31 1234567890",
      },
      updatedAt: expect.anything(),
      createdAt: expect.anything(),
    });
  });

  it(`updates current user's user object and returns the object`, async () => {
    const args: MutationUpdateUserProfileArgs = {
      data: {
        email: `email${nanoid().toLowerCase()}@gmail.com`,
        firstName: "newFirstName",
        lastName: "newLastName",
        birthDate: date,
        educationGrade: "GRADUATE",
        employmentStatus: "FULL_TIME",
        gender: "FEMALE",
        maritalStatus: "SINGLE",
        appLanguageCode: "fr",
        address: {
          city: "CityName",
          countryCode: "123",
          dependentLocality: "345",
          line1: "Street ABC",
          line2: "Near XYZ Park",
          postalCode: "45672",
          sortingCode: "234",
          state: "StateName",
        },
        phone: {
          home: "020 89024004",
          mobile: "+91 1234567890",
          work: "+31 1234567890",
        },
      },
      file: "newImageFile.png",
    };

    vi.spyOn(uploadEncodedImage, "uploadEncodedImage").mockImplementation(
      async (encodedImageURL: string) => encodedImageURL,
    );

    const deleteFromCacheSpy = vi
      .spyOn(userCache, "deleteUserFromCache")
      .mockImplementation(async () => Promise.resolve());

    const context = {
      userId: testUser._id,
      apiRootUrl: BASE_URL,
    };

    const updateUserProfilePayload = await updateUserProfileResolver?.(
      {},
      args,
      context,
    );

    expect(deleteFromCacheSpy).toHaveBeenCalledWith(
      updateUserProfilePayload?._id.toString(),
    );
    expect(updateUserProfilePayload).toEqual({
      ...testUser.toObject(),
      email: args.data?.email,
      firstName: args.data?.firstName,
      lastName: args.data?.lastName,
      image: args.file,
      birthDate: date,
      educationGrade: args.data?.educationGrade,
      employmentStatus: args.data?.employmentStatus,
      gender: args.data?.gender,
      maritalStatus: args.data?.maritalStatus,
      address: args.data?.address,
      phone: args.data?.phone,
      updatedAt: expect.anything(),
      createdAt: expect.anything(),
    });
  });

  it(`if data is undefined dont update the profile`, async () => {
    const args: MutationUpdateUserProfileArgs = {
      data: undefined,
    };

    const context = {
      userId: testUser._id,
      apiRootUrl: BASE_URL,
    };

    const updateUserProfilePayload = await updateUserProfileResolver?.(
      {},
      args,
      context,
    );

    expect(updateUserProfilePayload).toEqual({});
  });
});
