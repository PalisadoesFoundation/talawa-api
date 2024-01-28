import { NotFoundError } from "./../../../src/libraries/errors/notFoundError";
import { QueryVenuesInOrganizationArgs } from "./../../../src/types/generatedGraphQLTypes";
import { TestVenueType, createTestVenue } from "./../../helpers/venue";
import "dotenv/config";
import type mongoose from "mongoose";
import { Organization } from "../../../src/models";
import { connect, disconnect } from "../../helpers/db";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type {
  TestUserType,
  TestOrganizationType,
} from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import { Types } from "mongoose";
import { ORGANIZATION_NOT_FOUND_ERROR } from "../../../src/constants";
let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let testVenue1: TestVenueType;
let testVenue2: TestVenueType;
let testVenue3: TestVenueType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, testOrganization] = await createTestUserAndOrganization();
  testVenue1 = await createTestVenue();
  testVenue2 = await createTestVenue();
  testVenue3 = await createTestVenue();
  await Organization.updateOne(
    {
      _id: testOrganization?._id,
    },
    {
      $push: {
        venues: [testVenue1?._id, testVenue2?._id, testVenue3?._id],
      },
    }
  );
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message
  );
}, 10000);

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> venuesInOrganization", () => {
  it(`throws NotFoundError if no organization exists`, async () => {
    try {
      const args: QueryVenuesInOrganizationArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?.id,
      };

      const { venuesInOrganization } = await import(
        "../../../src/resolvers/Query/venuesInOrganization"
      );

      await venuesInOrganization?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      } else {
        fail(`Expected NotFoundError, but got ${error}`);
      }
    }
  });

  it(`returns list of all existing venues present in the organization`, async () => {
    const args: QueryVenuesInOrganizationArgs = {
      id: testOrganization?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    const { venuesInOrganization } = await import(
      "../../../src/resolvers/Query/venuesInOrganization"
    );

    const venues = await venuesInOrganization?.({}, args, context);
    const organization = await Organization.findOne({
      _id: testOrganization?.id,
    })
      .populate("venues")
      .lean();

    const allVenues = organization?.venues;
    expect(venues).toEqual(
      expect.arrayContaining(
        allVenues!.map((venue) =>
          expect.objectContaining({
            _id: venue._id,
          })
        )
      )
    );
  });
});
