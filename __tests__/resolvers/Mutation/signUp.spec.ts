import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
  Interface_Organization,
} from "../../../src/lib/models";
import {
  MutationSignUpArgs,
  UserType,
} from "../../../src/generated/graphqlCodegen";
import { connect, disconnect } from "../../../src/db";
import { signUp as signUpResolver } from "../../../src/lib/resolvers/Mutation/signUp";
import {
  androidFirebaseOptions,
  iosFirebaseOptions,
} from "../../../src/lib/config";
import { ORGANIZATION_NOT_FOUND } from "../../../src/constants";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUser: Interface_User & Document<any, any, Interface_User>;
let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;

beforeAll(async () => {
  await connect();

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
          userType: UserType.User,
        },
      };

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
        userType: UserType.User,
      },
    };

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
          userType: UserType.User,
        },
      };

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
        userType: UserType.User,
      },
    };

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
});
