import "dotenv/config";
import type mongoose from "mongoose";
import type { MutationCreateAdvertisementArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  afterEach,
  vi,
} from "vitest";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import {
  createTestSuperAdmin,
  createTestAdvertisement,
} from "../../helpers/advertisement";
import type {
  TestAdvertisementType,
  TestSuperAdminType,
} from "../../helpers/advertisement";
import {
  ADVERTISEMENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { requestContext } from "../../../src/libraries";
import { ApplicationError } from "../../../src/libraries/errors";
import type { InterfaceAdvertisement } from "../../../src/models";

let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let testSuperAdmin: TestSuperAdminType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testAdvertisement: TestAdvertisementType;

vi.mock("../../utilities/uploadEncodedImage", () => ({
  uploadEncodedImage: vi.fn(),
}));

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
  testOrganization = temp[1];
  testSuperAdmin = await createTestSuperAdmin();
  testAdvertisement = await createTestAdvertisement();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> deleteAdvertisement", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
    vi.resetAllMocks();
  });

  it(`throws NotFoundError if no user exists with _id === context.userId `, async () => {
    // deleting
    const { deleteAdvertisement } = await import(
      "../../../src/resolvers/Mutation/deleteAdvertisement"
    );
    const context = {
      userId: "123456789sdfghjk",
    };
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message: string) => `Translated ${message}`);

    try {
      await deleteAdvertisement?.({}, { id: testAdvertisement._id }, context);
    } catch (error: unknown) {
      if (!(error instanceof ApplicationError)) return;
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws NotFoundError if no user exists with _id === context.userId `, async () => {
    // deleting
    const { deleteAdvertisement } = await import(
      "../../../src/resolvers/Mutation/deleteAdvertisement"
    );
    const context = {
      userId: "",
    };
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message: string) => `Translated ${message}`);

    try {
      await deleteAdvertisement?.({}, { id: testAdvertisement._id }, context);
    } catch (error: unknown) {
      if (!(error instanceof ApplicationError)) return;
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws  UserNotAuthorized Error if the userType is USER`, async () => {
    // deleting
    const { deleteAdvertisement } = await import(
      "../../../src/resolvers/Mutation/deleteAdvertisement"
    );

    const context = { userId: testUser?._id };

    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message: string) => `Translated ${message}`);

    try {
      await deleteAdvertisement?.({}, { id: testAdvertisement._id }, context);
    } catch (error: unknown) {
      if (!(error instanceof ApplicationError)) return;
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
      );
    }
  });

  it(`creates the ad and then deleting the ad`, async () => {
    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message) => `Translated ${message}`,
    );
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
    const createdAdvertisement =
      createdAdvertisementPayload?.advertisement as InterfaceAdvertisement;

    // deleting the ad
    const { deleteAdvertisement } = await import(
      "../../../src/resolvers/Mutation/deleteAdvertisement"
    );

    const deleteAdvertisementPayload = await deleteAdvertisement?.(
      {},
      { id: createdAdvertisement?._id },
      context,
    );
    expect(deleteAdvertisementPayload).toEqual(createdAdvertisementPayload);
  });
  it("should throw NOT_FOUND_ERROR on wrong advertisement", async () => {
    // deleting
    const { deleteAdvertisement } = await import(
      "../../../src/resolvers/Mutation/deleteAdvertisement"
    );
    const context = {
      userId: testUser?.id,
    };
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message: string) => `Translated ${message}`);

    try {
      await deleteAdvertisement?.(
        {},
        { id: "64d1f8cb77a4b51004f824b8" },
        context,
      );
    } catch (error: unknown) {
      if (!(error instanceof ApplicationError)) return;
      expect(spy).toBeCalledWith(ADVERTISEMENT_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${ADVERTISEMENT_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it("should throw NOT_FOUND_ERROR when id not provided", async () => {
    // deleting
    const { deleteAdvertisement } = await import(
      "../../../src/resolvers/Mutation/deleteAdvertisement"
    );
    const context = {
      userId: testUser?.id,
    };
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message: string) => `Translated ${message}`);

    try {
      await deleteAdvertisement?.({}, { id: "" }, context);
    } catch (error: unknown) {
      if (!(error instanceof ApplicationError)) return;
      expect(spy).toBeCalledWith(ADVERTISEMENT_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${ADVERTISEMENT_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });
});
