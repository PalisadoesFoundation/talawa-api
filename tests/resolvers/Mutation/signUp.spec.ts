import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
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
  LAST_RESORT_SUPERADMIN_EMAIL,
  ORGANIZATION_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { AppUserProfile, Organization, User } from "../../../src/models";
import { signUp as signUpResolverImage } from "../../../src/resolvers/Mutation/signUp";
import type { MutationSignUpArgs } from "../../../src/types/generatedGraphQLTypes";
import * as uploadEncodedImage from "../../../src/utilities/encodedImageStorage/uploadEncodedImage";
import { connect, disconnect } from "../../helpers/db";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import _ from "lodash";

const testImagePath = `${nanoid().toLowerCase()}test.png`;
let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;

let testOrganization: TestOrganizationType;

vi.mock("../../utilities/uploadEncodedImage", () => ({
  uploadEncodedImage: vi.fn(),
}));

vi.mock("../../../src/constants", async () => {
  const constants: object = await vi.importActual("../../../src/constants");
  return {
    ...constants,
    LAST_RESORT_SUPERADMIN_EMAIL: "admin@email.com",
  };
});

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];

  testOrganization = temp[1];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> signUp", () => {
  afterEach(async () => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it(`creates the user with provided organizationUserBelongsToId and returns the
  created user  with accessToken, refreshToken`, async () => {
    const email = `email${nanoid().toLowerCase()}@gmail.com`;

    const args: MutationSignUpArgs = {
      data: {
        email,
        firstName: "firstName",
        lastName: "lastName",
        password: "password",
        appLanguageCode: "en",
        selectedOrganization: testOrganization?.id,
      },
    };
    const { signUp: signUpResolver } = await import(
      "../../../src/resolvers/Mutation/signUp"
    );

    const signUpPayload = await signUpResolver?.({}, args, {});

    const createdUser = await User.findOne({
      email,
    })
      .populate("joinedOrganizations")
      .populate("registeredEvents")
      .populate("membershipRequests")
      .populate("organizationsBlockedBy")
      .select("-password")
      .lean();

    const createdUserAppProfile = await AppUserProfile.findOne({
      userId: createdUser?._id,
    })
      .populate("createdOrganizations")
      .populate("createdEvents")
      .populate("eventAdmin")
      .populate("adminFor")
      .lean();

    expect(_.isEqual(signUpPayload?.user, createdUser)).toBe(true);
    expect(
      _.isEqual(signUpPayload?.appUserProfile, createdUserAppProfile),
    ).toBe(true);

    expect(typeof signUpPayload?.accessToken).toEqual("string");
    expect(signUpPayload?.accessToken.length).toBeGreaterThan(1);

    expect(typeof signUpPayload?.refreshToken).toEqual("string");
    expect(signUpPayload?.refreshToken.length).toBeGreaterThan(1);
  });

  it(`when uploadImage is called with newFile `, async () => {
    vi.spyOn(uploadEncodedImage, "uploadEncodedImage").mockImplementation(
      async (encodedImageURL: string) => encodedImageURL,
    );

    const email = `email${nanoid().toLowerCase()}@gmail.com`;

    const args: MutationSignUpArgs = {
      data: {
        email,
        firstName: "firstName",
        lastName: "lastName",
        password: "password",
        selectedOrganization: testOrganization?.id,
      },
      file: testImagePath,
    };

    const signedUpUserPayload = await signUpResolverImage?.({}, args, {});
    await User.findOne({
      email,
    })
      .select("-password")
      .lean();

    const user = await signedUpUserPayload?.user;
    const path = user?.image;
    expect(path).toBe(testImagePath);
  });

  it(`Promotes the user to SUPER ADMIN if the email registering with is same that as provided in configuration file`, async () => {
    const email = LAST_RESORT_SUPERADMIN_EMAIL;
    const args: MutationSignUpArgs = {
      data: {
        email,
        firstName: "firstName",
        lastName: "lastName",
        password: "password",
        appLanguageCode: "en",
        selectedOrganization: testOrganization?._id,
      },
    };
    const { signUp: signUpResolver } = await import(
      "../../../src/resolvers/Mutation/signUp"
    );
    await signUpResolver?.({}, args, {});
    const createdUser = await User.findOne({
      email,
    });
    const createdAppUserProfile = await AppUserProfile.findOne({
      userId: createdUser?._id,
    });
    expect(createdAppUserProfile?.isSuperAdmin).toEqual(true);
  });
  it(`Check if the User is not being promoted to SUPER ADMIN automatically`, async () => {
    const email = `email${nanoid().toLowerCase()}@gmail.com`;
    const args: MutationSignUpArgs = {
      data: {
        email,
        firstName: "firstName",
        lastName: "lastName",
        password: "password",
        appLanguageCode: "en",
        selectedOrganization: testOrganization?._id,
      },
    };
    const { signUp: signUpResolver } = await import(
      "../../../src/resolvers/Mutation/signUp"
    );
    await signUpResolver?.({}, args, {});
    const createdUser = await User.findOne({
      email,
    });
    const createdAppUserProfile = await AppUserProfile.findOne({
      userId: createdUser?._id,
    });
    expect(createdAppUserProfile?.isSuperAdmin).toBeFalsy();
  });
});

describe("resolvers -> Mutation -> signUp", () => {
  afterEach(async () => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  it(`throws ConflictError  message if a user already with email === args.data.email already exists`, async () => {
    const EMAIL_MESSAGE = "email.alreadyExists";
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationSignUpArgs = {
        data: {
          email: testUser?.email,
          firstName: "firstName",
          lastName: "lastName",
          password: "password",
          appLanguageCode: "en",
          selectedOrganization: testOrganization?._id,
        },
      };

      const { signUp: signUpResolver } = await import(
        "../../../src/resolvers/Mutation/signUp"
      );

      await signUpResolver?.({}, args, {});
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(EMAIL_MESSAGE);
      expect((error as Error).message).toEqual(EMAIL_MESSAGE);
    }
  });
  it(`throws NotFoundError message if no organization exists with _id === args.data.selectedOrganization`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => message,
    );
    try {
      const email = `email${nanoid().toLowerCase()}@gmail.com`;

      const args: MutationSignUpArgs = {
        data: {
          email,
          firstName: "firstName",
          lastName: "lastName",
          password: "password",
          appLanguageCode: "en",
          selectedOrganization: new Types.ObjectId().toString(),
        },
      };

      const { signUp: signUpResolver } = await import(
        "../../../src/resolvers/Mutation/signUp"
      );

      await signUpResolver?.({}, args, {});
    } catch (error: unknown) {
      // expect((error as E)).toBeCalledWith(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });
  it("creates user with joining the organization if userRegistrationRequired is false", async () => {
    const email = `email${nanoid().toLowerCase()}@gmail.com`;

    const args: MutationSignUpArgs = {
      data: {
        email,
        firstName: "firstName",
        lastName: "lastName",
        password: "password",
        appLanguageCode: "en",
        selectedOrganization: testOrganization?._id,
      },
    };
    const { signUp: signUpResolver } = await import(
      "../../../src/resolvers/Mutation/signUp"
    );

    await signUpResolver?.({}, args, {});

    const createdUser = await User.findOne({
      email,
    }).select("-password");

    // console.log(createdUser?.joinedOrganizations, testOrganization?._id);
    expect(createdUser?.joinedOrganizations).toContainEqual(
      testOrganization?._id,
    );
  });
  it("send membership request if the user registration is required by the organization", async () => {
    const email = `email${nanoid().toLowerCase()}@gmail.com`;

    const organization = await Organization.create({
      name: `orgName${nanoid().toLowerCase()}`,
      description: `orgDesc${nanoid().toLowerCase()}`,
      userRegistrationRequired: true,
      creatorId: testUser?._id,
      admins: [],
      membershipRequests: [],
      members: [testUser?._id],
      visibleInSearch: false,
    });
    const args: MutationSignUpArgs = {
      data: {
        email,
        firstName: "firstName",
        lastName: "lastName",
        password: "password",
        appLanguageCode: "en",
        selectedOrganization: organization?._id.toString(),
      },
    };
    const { signUp: signUpResolver } = await import(
      "../../../src/resolvers/Mutation/signUp"
    );

    await signUpResolver?.({}, args, {});

    const createdUser = await User.findOne({
      email,
    })
      .select("-password")
      .lean();
    // console.log(createdUser);
    const updatedOrganization = await Organization.findById(organization?._id);
    expect(createdUser?.joinedOrganizations).not.toContainEqual(
      testOrganization?._id,
    );
    expect(updatedOrganization?.membershipRequests).toHaveLength(1);
  });
  it("creates appUserProfile with userId === createdUser._id", async () => {
    const email = `email${nanoid().toLowerCase()}@gmail.com`;

    const args: MutationSignUpArgs = {
      data: {
        email,
        firstName: "firstName",
        lastName: "lastName",
        password: "password",
        appLanguageCode: "en",
        selectedOrganization: testOrganization?._id,
      },
    };
    const { signUp: signUpResolver } = await import(
      "../../../src/resolvers/Mutation/signUp"
    );

    await signUpResolver?.({}, args, {});

    const createdUser = await User.findOne({
      email,
    }).select("-password");

    const appUserProfile = await AppUserProfile.findOne({
      userId: createdUser?._id,
    });

    expect(appUserProfile).toBeTruthy();
  });
});
