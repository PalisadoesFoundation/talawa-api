import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  ADVERTISEMENT_NOT_FOUND_ERROR,
  END_DATE_VALIDATION_ERROR,
  FIELD_NON_EMPTY_ERROR,
  INPUT_NOT_FOUND_ERROR,
  START_DATE_VALIDATION_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { Advertisement } from "../../../src/models";
import { updateAdvertisement as updateAdvertisementResolver } from "../../../src/resolvers/Mutation/updateAdvertisement";
import type { MutationUpdateAdvertisementArgs } from "../../../src/types/generatedGraphQLTypes";
import {
  createTestAdvertisement,
  createTestSuperAdmin,
  type TestAdvertisementType,
  type TestSuperAdminType,
} from "../../helpers/advertisement";
import { connect, disconnect } from "../../helpers/db";
import { createTestUser, type TestUserType } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testAdvertisement: TestAdvertisementType;
let testSuperAdmin: TestSuperAdminType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  testSuperAdmin = await createTestSuperAdmin();
  testAdvertisement = await createTestAdvertisement();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> updateAdvertisement", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId `, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateAdvertisementArgs = {
        input: {
          _id: testAdvertisement?._id,
          name: "Sample",
        },
      };

      const context = { userId: Types.ObjectId().toString() };

      const { updateAdvertisement: updateAdvertisementResolverNotFoundError } =
        await import("../../../src/resolvers/Mutation/updateAdvertisement");

      await updateAdvertisementResolverNotFoundError?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws Authorization Error if the userType is USER`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

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
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no advertisement exists with _id === args.id `, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateAdvertisementArgs = {
        input: {
          _id: Types.ObjectId().toString(),
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
      expect(spy).toHaveBeenLastCalledWith(
        ADVERTISEMENT_NOT_FOUND_ERROR.MESSAGE,
      );
      expect((error as Error).message).toEqual(
        `Translated ${ADVERTISEMENT_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`updates the advertisement with _id === args.id and returns it`, async () => {
    const args: MutationUpdateAdvertisementArgs = {
      input: {
        _id: testAdvertisement?._id,
        name: "New Advertisement Name",
        link: "Updated Advertisement Link",
        type: "POPUP",
        startDate: new Date(new Date().getFullYear() + 0, 11, 31)
          .toISOString()
          .split("T")[0],
        endDate: new Date(new Date().getFullYear() + 1, 11, 31)
          .toISOString()
          .split("T")[0],
      },
    };

    const context = { userId: testSuperAdmin?._id };

    const updateAdvertisementPayload = await updateAdvertisementResolver?.(
      {},
      args,
      context,
    );
    const { advertisement } = updateAdvertisementPayload || {};

    const updatedTestAdvertisement = await Advertisement.findOne({
      _id: testAdvertisement?._id,
    }).lean();

    let expectedAdvertisement;

    if (!updatedTestAdvertisement) {
      console.error("Updated advertisement not found in the database");
    } else {
      expectedAdvertisement = {
        _id: updatedTestAdvertisement._id.toString(), // Ensure _id is converted to String as per GraphQL schema
        name: updatedTestAdvertisement.name,
        orgId: updatedTestAdvertisement.orgId.toString(),
        link: updatedTestAdvertisement.link,
        type: updatedTestAdvertisement.type,
        startDate: updatedTestAdvertisement.startDate,
        endDate: updatedTestAdvertisement.endDate,
        createdAt: updatedTestAdvertisement.createdAt,
        updatedAt: updatedTestAdvertisement.updatedAt,
      };
    }
    expect(advertisement).toEqual(expectedAdvertisement);
  });

  it(`throws ValidationError if endDate is before startDate`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateAdvertisementArgs = {
        input: {
          _id: testAdvertisement?._id,
          name: "New Advertisement Name",
          link: "Updated Advertisement Link",
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
      expect(spy).toHaveBeenLastCalledWith(END_DATE_VALIDATION_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${END_DATE_VALIDATION_ERROR.MESSAGE}`,
      );
    }
  });
  it(`throws ValidationError if startDate is before current Date`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateAdvertisementArgs = {
        input: {
          _id: testAdvertisement?._id,
          startDate: "2023-12-26",
        },
      };
      const context = { userId: testSuperAdmin?._id };

      const {
        updateAdvertisement: updateAdvertisementResolverValidationError,
      } = await import("../../../src/resolvers/Mutation/updateAdvertisement");

      await updateAdvertisementResolverValidationError?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(START_DATE_VALIDATION_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${START_DATE_VALIDATION_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws InputValidationError if no field other than _id is present in args.input`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateAdvertisementArgs = {
        input: {
          _id: testAdvertisement?._id,
        },
      };

      const context = { userId: testSuperAdmin?._id };

      const { updateAdvertisement: updateAdvertisementResolverInputError } =
        await import("../../../src/resolvers/Mutation/updateAdvertisement");

      await updateAdvertisementResolverInputError?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(INPUT_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${INPUT_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });
  it(`throws InputValidationError if a field has null value or empty string`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateAdvertisementArgs = {
        input: {
          _id: testAdvertisement?._id,
          name: null,
        },
      };

      const context = { userId: testSuperAdmin?._id };

      const { updateAdvertisement: updateAdvertisementResolverInputError } =
        await import("../../../src/resolvers/Mutation/updateAdvertisement");

      await updateAdvertisementResolverInputError?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(FIELD_NON_EMPTY_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${FIELD_NON_EMPTY_ERROR.MESSAGE}`,
      );
    }
  });
});
