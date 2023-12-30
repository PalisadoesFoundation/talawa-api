import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { TransactionLog, User } from "../../../src/models";
import type { MutationSignUpArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import {
  LAST_RESORT_SUPERADMIN_EMAIL,
  ORGANIZATION_NOT_FOUND_ERROR,
  TRANSACTION_LOG_TYPES,
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
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import * as uploadEncodedImage from "../../../src/utilities/encodedImageStorage/uploadEncodedImage";
import { signUp as signUpResolverImage } from "../../../src/resolvers/Mutation/signUp";
import { wait } from "./acceptAdmin.spec";

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

  it(`creates the user and returns the created user with accessToken, refreshToken`, async () => {
    const email = `email${nanoid().toLowerCase()}@gmail.com`;

    const args: MutationSignUpArgs = {
      data: {
        email,
        firstName: "firstName",
        lastName: "lastName",
        password: "password",
        appLanguageCode: "en",
        organizationUserBelongsToId: undefined,
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
    }).toEqual({
      user: createdUser,
    });

    expect(typeof signUpPayload?.accessToken).toEqual("string");
    expect(signUpPayload?.accessToken.length).toBeGreaterThan(1);

    expect(typeof signUpPayload?.refreshToken).toEqual("string");
    expect(signUpPayload?.refreshToken.length).toBeGreaterThan(1);
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
        organizationUserBelongsToId: testOrganization?.id,
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
    }).toEqual({
      user: createdUser,
    });

    expect(typeof signUpPayload?.accessToken).toEqual("string");
    expect(signUpPayload?.accessToken.length).toBeGreaterThan(1);

    expect(typeof signUpPayload?.refreshToken).toEqual("string");
    expect(signUpPayload?.refreshToken.length).toBeGreaterThan(1);

    await wait();

    const mostRecentTransactions = await TransactionLog.find()
      .sort({
        createdAt: -1,
      })
      .limit(1);

    expect(mostRecentTransactions[0]).toMatchObject({
      createdBy: createdUser,
      type: TRANSACTION_LOG_TYPES.CREATE,
      modelName: "User",
    });
  });
  it(`when uploadImage is called with newFile `, async () => {
    vi.spyOn(uploadEncodedImage, "uploadEncodedImage").mockImplementation(
      async (encodedImageURL: string) => encodedImageURL
    );

    const email = `email${nanoid().toLowerCase()}@gmail.com`;

    const args: MutationSignUpArgs = {
      data: {
        email,
        firstName: "firstName",
        lastName: "lastName",
        password: "password",
        appLanguageCode: "en",
        organizationUserBelongsToId: testOrganization?.id,
      },
      file: testImagePath,
    };

    const signedUpUserPayload = await signUpResolverImage?.({}, args, {});
    await User.findOne({
      email,
    })
      .select("-password")
      .lean();

    expect(signedUpUserPayload?.user).toContain({
      image: testImagePath,
    });
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
        organizationUserBelongsToId: undefined,
      },
    };
    const { signUp: signUpResolver } = await import(
      "../../../src/resolvers/Mutation/signUp"
    );
    await signUpResolver?.({}, args, {});
    const createdUser = await User.findOne({
      email,
    });
    expect(createdUser?.userType).toEqual("SUPERADMIN");
    expect(createdUser?.adminApproved).toBeTruthy();
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
        organizationUserBelongsToId: undefined,
      },
    };
    const { signUp: signUpResolver } = await import(
      "../../../src/resolvers/Mutation/signUp"
    );
    await signUpResolver?.({}, args, {});
    const createdUser = await User.findOne({
      email,
    });
    expect(createdUser?.userType).not.to.toEqual("SUPERADMIN");
    expect(createdUser?.adminApproved).toBeFalsy();
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
          organizationUserBelongsToId: undefined,
        },
      };

      const { signUp: signUpResolver } = await import(
        "../../../src/resolvers/Mutation/signUp"
      );

      await signUpResolver?.({}, args, {});
    } catch (error: any) {
      expect(spy).toBeCalledWith(EMAIL_MESSAGE);
      expect(error.message).toEqual(EMAIL_MESSAGE);
    }
  });
  it(`throws NotFoundError message if no organization exists with _id === args.data.organizationUserBelongsToId`, async () => {
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
        },
      };

      const { signUp: signUpResolver } = await import(
        "../../../src/resolvers/Mutation/signUp"
      );

      await signUpResolver?.({}, args, {});
    } catch (error: any) {
      expect(spy).toBeCalledWith(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
    }
  });
});
