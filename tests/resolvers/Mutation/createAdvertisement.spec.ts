import "dotenv/config";
import type mongoose from "mongoose";
import type { MutationCreateAdvertisementArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { Types } from "mongoose";
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
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { requestContext } from "../../../src/libraries";
import { ApplicationError } from "../../../src/libraries/errors";
import { createAdvertisement } from "../../../src/resolvers/Mutation/createAdvertisement";
import * as uploadEncodedImage from "../../../src/utilities/encodedImageStorage/uploadEncodedImage";
import { createTestSuperAdmin } from "../..//helpers/advertisement";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";

let testSuperAdmin: TestUserType;
let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;

vi.mock("../../utilities/uploadEncodedImage", () => ({
  uploadEncodedImage: vi.fn(),
}));

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, testOrganization] = await createTestUserAndOrganization();
  testSuperAdmin = await createTestSuperAdmin();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createAdvertisement", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
    vi.resetAllMocks();
  });

  it(`throws organization NotFoundError`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);
    try {
      const args: MutationCreateAdvertisementArgs = {
        input: {
          name: "myad",
          organizationId: new Types.ObjectId().toString(),
          type: "POPUP",
          mediaFile: "data:image/png;base64,bWVkaWEgY29udGVudA==",
          startDate: "2023-10-08T13:02:29.000Z",
          endDate: "2023-10-08T13:02:29.000Z",
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { createAdvertisement: createAdvertisementResolver } = await import(
        "../../../src/resolvers/Mutation/createAdvertisement"
      );

      await createAdvertisementResolver?.({}, args, context);
    } catch (error: unknown) {
      if (!(error instanceof ApplicationError)) return;
      expect(spy).toBeCalledWith(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${ORGANIZATION_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);
    try {
      const args: MutationCreateAdvertisementArgs = {
        input: {
          name: "myad",
          organizationId: testOrganization?._id,
          type: "POPUP",
          mediaFile: "data:image/png;base64,bWVkaWEgY29udGVudA==",
          startDate: "2023-10-08T13:02:29.000Z",
          endDate: "2023-10-08T13:02:29.000Z",
        },
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      const { createAdvertisement: createAdvertisementResolver } = await import(
        "../../../src/resolvers/Mutation/createAdvertisement"
      );

      await createAdvertisementResolver?.({}, args, context);
    } catch (error: unknown) {
      if (!(error instanceof ApplicationError)) return;
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`creates the post and returns it when image is not provided`, async () => {
    const args: MutationCreateAdvertisementArgs = {
      input: {
        name: "myad",
        organizationId: testOrganization?._id,
        type: "POPUP",
        mediaFile: "data:video/mp4;base64,bWVkaWEgY29udGVudA==",
        startDate: "2023-10-08T13:02:29.000Z",
        endDate: "2023-10-08T13:02:29.000Z",
      },
    };

    const context = {
      userId: testSuperAdmin?.id,
    };

    const { createAdvertisement: createAdvertisementResolver } = await import(
      "../../../src/resolvers/Mutation/createAdvertisement"
    );

    const createdAdvertisementPayload = await createAdvertisementResolver?.(
      {},
      args,
      context,
    );

    expect(createdAdvertisementPayload?.advertisement).toHaveProperty(
      "name",
      "myad",
    );

    expect(createdAdvertisementPayload?.advertisement).toHaveProperty(
      "type",
      "POPUP",
    );
  });

  it(`creates the post and throws an error for unsupported file type`, async () => {
    const args: MutationCreateAdvertisementArgs = {
      input: {
        name: "myad",
        organizationId: testOrganization?._id,
        type: "POPUP",
        mediaFile: "unsupportedFile.txt",
        startDate: "2023-10-08T13:02:29.000Z",
        endDate: "2023-10-08T13:02:29.000Z",
      },
    };

    const context = {
      userId: testUser?.id,
      apiRootUrl: BASE_URL,
    };

    // Mock the uploadEncodedImage function to throw an error for unsupported file types
    vi.spyOn(uploadEncodedImage, "uploadEncodedImage").mockImplementation(
      () => {
        throw new Error("Unsupported file type.");
      },
    );

    // Ensure that an error is thrown when createPostResolverImage is called
    await expect(createAdvertisement?.({}, args, context)).rejects.toThrowError(
      "Unsupported file type.",
    );
  });

  it(`should create the ad and returns `, async () => {
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`,
    );
    const args: MutationCreateAdvertisementArgs = {
      input: {
        name: "myadvertisement",
        organizationId: testOrganization?._id,
        type: "POPUP",
        mediaFile: "data:image/png;base64,bWVkaWEgY29udGVudA==",
        startDate: "2023-10-08T13:02:29.000Z",
        endDate: "2023-10-08T13:02:29.000Z",
      },
    };

    const context = {
      userId: testUser?.id,
    };

    const { createAdvertisement: createAdvertisementResolver } = await import(
      "../../../src/resolvers/Mutation/createAdvertisement"
    );

    const createdAdvertisementPayload = await createAdvertisementResolver?.(
      {},
      args,
      context,
    );
    expect(createdAdvertisementPayload?.advertisement).toHaveProperty(
      "name",
      "myadvertisement",
    );

    expect(createdAdvertisementPayload?.advertisement).toHaveProperty(
      "type",
      "POPUP",
    );
  });
});
