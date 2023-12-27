import type mongoose from "mongoose";
import { Types } from "mongoose";
import { Advertisement, User } from "../../../src/models";
import type { MutationUpdateAdvertisementArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import { updateAdvertisement as updateAdvertisementResolver } from "../../../src/resolvers/Mutation/updateAdvertisement";
import {
  ADVERTISEMENT_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { createTestUser, type TestUserType } from "../../helpers/userAndOrg";

type AdvertisementTypes = {
  type: "POPUP" | "MENU" | "BANNER";
  // Other properties specific to each type
};

// Define TestAdvertisementType
type TestAdvertisementType = {
  _id: string;
  name: string;
  link: string;
  type: AdvertisementTypes;
  startDate: string;
  endDate: string;
  // Add other fields based on your Advertisement model
};

// Function to create test advertisement
const createTestAdvertisement = async (): Promise<TestAdvertisementType> => {
  const testAdvertisementData = {
    name: "Test Advertisement",
    link: "https://example.com",
    type: "POPUP",
    startDate: "2023-01-01",
    endDate: "2023-01-31",
    // Add other fields based on your Advertisement model
  };

  // Create test advertisement in the database (assuming Advertisement model has create method)
  const createdAdvertisement = await Advertisement.create(
    testAdvertisementData
  );

  return {
    _id: createdAdvertisement._id.toString(),
    name: createdAdvertisement.name,
    link: createdAdvertisement.link,
    type: createdAdvertisement.type,
    startDate: createdAdvertisement.startDate,
    endDate: createdAdvertisement.endDate,
    // Map other fields as needed
  };
};

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testAdvertisement: TestAdvertisementType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
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
          id: testAdvertisement?._id,
        },
      };

      const context = { userId: Types.ObjectId().toString() };

      const { updateAdvertisement: updateAdvertisementResolverNotFoundError } =
        await import("../../../src/resolvers/Mutation/updateAdvertisement");

      await updateAdvertisementResolverNotFoundError?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
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
          id: Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { updateAdvertisement: updateAdvertisementResolverNotFoundError } =
        await import("../../../src/resolvers/Mutation/updateAdvertisement");

      await updateAdvertisementResolverNotFoundError?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(
        ADVERTISEMENT_NOT_FOUND_ERROR.MESSAGE
      );
      expect(error.message).toEqual(
        `Translated ${ADVERTISEMENT_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`updates the advertisement with _id === args.id and returns it`, async () => {
    const args: MutationUpdateAdvertisementArgs = {
      input: {
        id: testAdvertisement!._id,
        name: "New Advertisement Name",
        link: "Updated Advertisement Link",
        type: "POPUP",
        startDate: "2023-12-26",
        endDate: "2023-12-31",
        // Include other fields you want to update
      },
    };

    const context = { userId: testUser?._id };

    const updateAdvertisementPayload = await updateAdvertisementResolver?.(
      {},
      args,
      context
    );

    const updatedTestAdvertisement = await Advertisement.findOne({
      _id: testAdvertisement!._id,
    }).lean();

    expect(updateAdvertisementPayload).toEqual(updatedTestAdvertisement);
  });
});
