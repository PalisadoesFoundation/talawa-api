import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  ADVERTISEMENT_NOT_FOUND_ERROR,
  BASE_URL,
  END_DATE_VALIDATION_ERROR,
  FIELD_NON_EMPTY_ERROR,
  INPUT_NOT_FOUND_ERROR,
  START_DATE_VALIDATION_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { ApplicationError } from "../../../src/libraries/errors";
import {
  Advertisement,
  AppUserProfile,
  Organization,
} from "../../../src/models";
import { updateAdvertisement as updateAdvertisementResolver } from "../../../src/resolvers/Mutation/updateAdvertisement";
import type { MutationUpdateAdvertisementArgs } from "../../../src/types/generatedGraphQLTypes";
import * as uploadEncodedImage from "../../../src/utilities/encodedImageStorage/uploadEncodedImage";
import {
  createTestAdvertisement,
  createTestSuperAdmin,
  type TestAdvertisementType,
  type TestSuperAdminType,
} from "../../helpers/advertisement";
import { connect, disconnect } from "../../helpers/db";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";
let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testAdvertisement: TestAdvertisementType;
let testSuperAdmin: TestSuperAdminType;
let testAdminUser: TestUserType;
let randomUser: TestUserType;
let testAdminUser2: TestUserType;
let testOrganization: TestOrganizationType;
let testAdvertisement2: TestAdvertisementType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  randomUser = await createTestUser();
  testAdminUser = await createTestUser();
  testSuperAdmin = await createTestSuperAdmin();
  testAdvertisement = await createTestAdvertisement();
  testAdminUser2 = await createTestUser();
  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testAdminUser?._id,
    admins: [testAdminUser?._id],
    members: [testUser?._id, testAdminUser?._id],
    creatorId: testAdminUser?._id,
  });
  testAdvertisement2 = await Advertisement.create({
    name: "Test Advertisement",
    mediaUrl: "data:image/png;base64,bWVkaWEgY29udG",
    type: "POPUP",
    startDate: "2023-01-01",
    endDate: "2023-01-31",
    organizationId: testOrganization?._id,
    createdAt: "2024-01-13T18:23:00.316Z",
    updatedAt: "2024-01-13T20:28:21.292Z",
    creatorId: testUser?._id,
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> updateAdvertisement", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId `, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message: string) => `Translated ${message}`);

    try {
      const args: MutationUpdateAdvertisementArgs = {
        input: {
          _id: testAdvertisement?._id,
          name: "Sample",
        },
      };

      const context = { userId: new Types.ObjectId().toString() };

      const { updateAdvertisement: updateAdvertisementResolverNotFoundError } =
        await import("../../../src/resolvers/Mutation/updateAdvertisement");

      await updateAdvertisementResolverNotFoundError?.({}, args, context);
    } catch (error: unknown) {
      if (!(error instanceof ApplicationError)) return;
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws Authorization Error if the userType is USER`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message: string) => `Translated ${message}`);

    try {
      const args: MutationUpdateAdvertisementArgs = {
        input: {
          _id: testAdvertisement?._id,
          name: "Sample",
        },
      };

      const context = { userId: testUser?._id };

      const { updateAdvertisement: updateAdvertisementResolverNotFoundError } =
        await import("../../../src/resolvers/Mutation/updateAdvertisement");

      await updateAdvertisementResolverNotFoundError?.({}, args, context);
    } catch (error: unknown) {
      if (!(error instanceof ApplicationError)) return;
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
  });
  it(`throws NotFoundError if no advertisement exists with _id === args.id `, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message: string) => `Translated ${message}`);

    try {
      const args: MutationUpdateAdvertisementArgs = {
        input: {
          _id: new Types.ObjectId().toString(),
          name: "Sample",
        },
      };

      const context = {
        userId: testSuperAdmin?.id,
      };

      const { updateAdvertisement: updateAdvertisementResolverNotFoundError } =
        await import("../../../src/resolvers/Mutation/updateAdvertisement");

      await updateAdvertisementResolverNotFoundError?.({}, args, context);
    } catch (error: unknown) {
      if (!(error instanceof ApplicationError)) return;
      expect(spy).toHaveBeenLastCalledWith(
        ADVERTISEMENT_NOT_FOUND_ERROR.MESSAGE,
      );
      expect(error.message).toEqual(
        `Translated ${ADVERTISEMENT_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`updates the advertisement with _id === args.id and returns it`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message: string) => `Translated ${message}`,
    );
    const superAdminTestUser = await AppUserProfile.findOneAndUpdate(
      {
        userId: randomUser?._id,
      },
      {
        isSuperAdmin: true,
      },
      {
        new: true,
      },
    );
    const args: MutationUpdateAdvertisementArgs = {
      input: {
        _id: testAdvertisement._id,
        name: "New Advertisement Name",
        mediaFile: "data:image/png;base64,bWaWEgY29udGVudA==",
        type: "POPUP",
        startDate: new Date(new Date().getFullYear() + 0, 11, 31)
          .toISOString()
          .split("T")[0],
        endDate: new Date(new Date().getFullYear() + 1, 11, 31)
          .toISOString()
          .split("T")[0],
      },
    };

    const context = { userId: superAdminTestUser?.userId };

    const updateAdvertisementPayload = await updateAdvertisementResolver?.(
      {},
      args,
      context,
    );
    const advertisement = updateAdvertisementPayload || {};

    const updatedTestAdvertisement = await Advertisement.findOne({
      _id: testAdvertisement._id,
    }).lean();

    let expectedAdvertisement;

    if (!updatedTestAdvertisement) {
      console.error("Updated advertisement not found in the database");
    } else {
      expectedAdvertisement = {
        _id: updatedTestAdvertisement._id.toString(), // Ensure _id is converted to String as per GraphQL schema
        name: updatedTestAdvertisement.name,
        organizationId: updatedTestAdvertisement.organizationId,
        mediaUrl: updatedTestAdvertisement.mediaUrl,
        type: updatedTestAdvertisement.type,
        startDate: updatedTestAdvertisement.startDate,
        endDate: updatedTestAdvertisement.endDate,
        createdAt: updatedTestAdvertisement.createdAt,
        updatedAt: updatedTestAdvertisement.updatedAt,
        creatorId: updatedTestAdvertisement.creatorId,
      };
    }
    expect(advertisement).toEqual({ advertisement: expectedAdvertisement });
  });
  it(`updates the advertisement with _id === args.id and returns it as an org admin`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message: string) => `Translated ${message}`,
    );

    await AppUserProfile.findOneAndUpdate(
      {
        userId: testAdminUser?._id,
      },
      {
        adminFor: [testOrganization?._id],
      },
      {
        new: true,
      },
    );
    const args: MutationUpdateAdvertisementArgs = {
      input: {
        _id: testAdvertisement2._id,
        name: "New Advertisement Name",
        mediaFile: "data:image/png;base64,bWaWEgY29udGVudA==",
        type: "POPUP",
        startDate: new Date(new Date().getFullYear() + 0, 11, 31)
          .toISOString()
          .split("T")[0],
        endDate: new Date(new Date().getFullYear() + 1, 11, 31)
          .toISOString()
          .split("T")[0],
      },
    };

    const context = { userId: testAdminUser?.id };

    const updateAdvertisementPayload = await updateAdvertisementResolver?.(
      {},
      args,
      context,
    );
    const advertisement = updateAdvertisementPayload || {};

    const updatedTestAdvertisement = await Advertisement.findOne({
      _id: testAdvertisement2._id,
    }).lean();

    let expectedAdvertisement;

    if (!updatedTestAdvertisement) {
      console.error("Updated advertisement not found in the database");
    } else {
      expectedAdvertisement = {
        _id: updatedTestAdvertisement._id.toString(), // Ensure _id is converted to String as per GraphQL schema
        name: updatedTestAdvertisement.name,
        organizationId: updatedTestAdvertisement.organizationId,
        mediaUrl: updatedTestAdvertisement.mediaUrl,
        type: updatedTestAdvertisement.type,
        startDate: updatedTestAdvertisement.startDate,
        endDate: updatedTestAdvertisement.endDate,
        createdAt: updatedTestAdvertisement.createdAt,
        updatedAt: updatedTestAdvertisement.updatedAt,
        creatorId: updatedTestAdvertisement.creatorId,
      };
    }
    expect(advertisement).toEqual({ advertisement: expectedAdvertisement });
  });
  it(`updates the advertisement media and returns it`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message: string) => `Translated ${message}`,
    );

    const args: MutationUpdateAdvertisementArgs = {
      input: {
        _id: testAdvertisement._id,
        name: "New Advertisement Name",
        mediaFile: "data:video/mp4;base64,rWaWEgY29udGVudA==",
        type: "POPUP",
      },
    };

    const context = { userId: testSuperAdmin?.id };

    const updateAdvertisementPayload = await updateAdvertisementResolver?.(
      {},
      args,
      context,
    );
    const advertisement = updateAdvertisementPayload || {};

    const updatedTestAdvertisement = await Advertisement.findOne({
      _id: testAdvertisement._id,
    }).lean();

    let expectedAdvertisement;

    if (!updatedTestAdvertisement) {
      console.error("Updated advertisement not found in the database");
    } else {
      expectedAdvertisement = {
        _id: updatedTestAdvertisement._id.toString(), // Ensure _id is converted to String as per GraphQL schema
        name: updatedTestAdvertisement.name,
        organizationId: updatedTestAdvertisement.organizationId,
        mediaUrl: updatedTestAdvertisement.mediaUrl,
        type: updatedTestAdvertisement.type,
        startDate: updatedTestAdvertisement.startDate,
        endDate: updatedTestAdvertisement.endDate,
        createdAt: updatedTestAdvertisement.createdAt,
        updatedAt: updatedTestAdvertisement.updatedAt,
        creatorId: updatedTestAdvertisement.creatorId,
      };
    }
    expect(advertisement).toEqual({ advertisement: expectedAdvertisement });
  });

  it(`updates the advertisement without media and returns it`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message: string) => `Translated ${message}`,
    );

    const args: MutationUpdateAdvertisementArgs = {
      input: {
        _id: testAdvertisement._id,
        name: "New Advertisement Name",
        type: "POPUP",
      },
    };

    const context = { userId: testSuperAdmin?.id };

    const updateAdvertisementPayload = await updateAdvertisementResolver?.(
      {},
      args,
      context,
    );
    const advertisement = updateAdvertisementPayload || {};

    const updatedTestAdvertisement = await Advertisement.findOne({
      _id: testAdvertisement._id,
    }).lean();

    let expectedAdvertisement;

    if (!updatedTestAdvertisement) {
      console.error("Updated advertisement not found in the database");
    } else {
      expectedAdvertisement = {
        _id: updatedTestAdvertisement._id.toString(), // Ensure _id is converted to String as per GraphQL schema
        name: updatedTestAdvertisement.name,
        organizationId: updatedTestAdvertisement.organizationId,
        mediaUrl: updatedTestAdvertisement.mediaUrl,
        type: updatedTestAdvertisement.type,
        startDate: updatedTestAdvertisement.startDate,
        endDate: updatedTestAdvertisement.endDate,
        createdAt: updatedTestAdvertisement.createdAt,
        updatedAt: updatedTestAdvertisement.updatedAt,
        creatorId: updatedTestAdvertisement.creatorId,
      };
    }
    expect(advertisement).toEqual({ advertisement: expectedAdvertisement });
  });

  it(`updates the advertisement media with unsupported file type`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    vi.spyOn(requestContext, "translate").mockImplementationOnce(
      (message: string) => `Translated ${message}`,
    );
    const args: MutationUpdateAdvertisementArgs = {
      input: {
        _id: testAdvertisement._id,
        name: "New Advertisement Name",
        mediaFile: "unsupportedFile.txt",
        type: "POPUP",
      },
    };

    const context = {
      userId: testSuperAdmin?.id,
      apiRootUrl: BASE_URL,
    };

    // Mock the uploadEncodedImage function to throw an error for unsupported file types
    vi.spyOn(uploadEncodedImage, "uploadEncodedImage").mockImplementation(
      () => {
        throw new Error("Unsupported file type.");
      },
    );

    // Ensure that an error is thrown when updateAdvertisementResolver is called
    await expect(
      updateAdvertisementResolver?.({}, args, context),
    ).rejects.toThrowError("Unsupported file type.");
  });

  it(`throws ValidationError if endDate is before startDate`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message: string) => `Translated ${message}`);

    try {
      const args: MutationUpdateAdvertisementArgs = {
        input: {
          _id: testAdvertisement._id,
          name: "New Advertisement Name",
          mediaFile: "data:video/mp4;base64,bWVkaWgY29udGVudA==",
          type: "POPUP",
          startDate: new Date(new Date().getFullYear() + 1, 11, 31)
            .toISOString()
            .split("T")[0],
          endDate: "2023-12-26", // Past date
        },
      };
      const context = { userId: testSuperAdmin?._id };

      const {
        updateAdvertisement: updateAdvertisementResolverValidationError,
      } = await import("../../../src/resolvers/Mutation/updateAdvertisement");

      await updateAdvertisementResolverValidationError?.({}, args, context);
    } catch (error: unknown) {
      if (!(error instanceof ApplicationError)) return;
      expect(spy).toHaveBeenLastCalledWith(END_DATE_VALIDATION_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${END_DATE_VALIDATION_ERROR.MESSAGE}`,
      );
    }
  });
  it(`throws ValidationError if startDate is before current Date`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message: string) => `Translated ${message}`);

    try {
      const args: MutationUpdateAdvertisementArgs = {
        input: {
          _id: testAdvertisement._id,
          startDate: "2023-12-26",
        },
      };
      const context = { userId: testSuperAdmin?._id };

      const {
        updateAdvertisement: updateAdvertisementResolverValidationError,
      } = await import("../../../src/resolvers/Mutation/updateAdvertisement");

      await updateAdvertisementResolverValidationError?.({}, args, context);
    } catch (error: unknown) {
      if (!(error instanceof ApplicationError)) return;
      expect(spy).toHaveBeenLastCalledWith(START_DATE_VALIDATION_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${START_DATE_VALIDATION_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws InputValidationError if no field other than _id is present in args.input`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message: string) => `Translated ${message}`);

    try {
      const args: MutationUpdateAdvertisementArgs = {
        input: {
          _id: testAdvertisement._id,
        },
      };

      const context = { userId: testSuperAdmin?._id };

      const { updateAdvertisement: updateAdvertisementResolverInputError } =
        await import("../../../src/resolvers/Mutation/updateAdvertisement");

      await updateAdvertisementResolverInputError?.({}, args, context);
    } catch (error: unknown) {
      if (!(error instanceof ApplicationError)) return;
      expect(spy).toHaveBeenLastCalledWith(INPUT_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${INPUT_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });
  it(`throws InputValidationError if a field has null value or empty string`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message: string) => `Translated ${message}`);

    try {
      const args: MutationUpdateAdvertisementArgs = {
        input: {
          _id: testAdvertisement._id,
          name: null,
        },
      };

      const context = { userId: testSuperAdmin?._id };

      const { updateAdvertisement: updateAdvertisementResolverInputError } =
        await import("../../../src/resolvers/Mutation/updateAdvertisement");

      await updateAdvertisementResolverInputError?.({}, args, context);
    } catch (error: unknown) {
      if (!(error instanceof ApplicationError)) return;
      expect(spy).toHaveBeenLastCalledWith(FIELD_NON_EMPTY_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${FIELD_NON_EMPTY_ERROR.MESSAGE}`,
      );
    }
  });
  it("throws UnauthorizedError if the user does not have an app profile", async () => {
    await AppUserProfile.deleteOne({ userId: testAdminUser2?._id });

    try {
      const { requestContext } = await import("../../../src/libraries");

      vi.spyOn(requestContext, "translate").mockImplementationOnce(
        (message: string) => `Translated ${message}`,
      );
      const args: MutationUpdateAdvertisementArgs = {
        input: {
          _id: testAdvertisement._id,
          name: "New Advertisement Name",
          mediaFile: "data:image/png;base64,bWaWEgY29udGVudA==",
          type: "POPUP",
          startDate: new Date(new Date().getFullYear() + 0, 11, 31)
            .toISOString()
            .split("T")[0],
          endDate: new Date(new Date().getFullYear() + 1, 11, 31)
            .toISOString()
            .split("T")[0],
        },
      };

      const context = { userId: testAdminUser2?._id };

      await updateAdvertisementResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
      );
    }
  });
});
