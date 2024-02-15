import { QueryVenueArgs } from "./../../../src/types/generatedGraphQLTypes";
import { TestOrganizationType } from "./../../helpers/userAndOrg";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { TestVenueType, createTestVenue } from "./../../helpers/venue";
import { connect, disconnect } from "../../helpers/db";
import { Organization, Venue } from "../../../src/models";
import { venue as venueResolver } from "../../../src/resolvers/Query/venue";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  VENUE_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let MONGOOSE_INSTANCE: typeof mongoose;
let testOrganization: TestOrganizationType;
let testVenue: TestVenueType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creatorId: Types.ObjectId().toString(),
    admins: [Types.ObjectId().toString()],
    members: [Types.ObjectId().toString()],
    visibleInSearch: true,
  });
  testVenue = await createTestVenue(Types.ObjectId());
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> venue", () => {
  it(`throws NotFoundError for venue not found`, async () => {
    try {
      const args: QueryVenueArgs = {
        id: Types.ObjectId().toString(),
      };

      await venueResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(VENUE_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError for organization not found`, async () => {
    try {
      const args: QueryVenueArgs = {
        id: testVenue?.id,
      };

      await venueResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`returns venue object with organizationId populated`, async () => {
    await Venue.findOneAndUpdate(
      {
        _id: testVenue?._id,
      },
      {
        $set: { organizationId: testOrganization?._id },
      },
      { new: true }
    );

    const args: QueryVenueArgs = {
      id: testVenue?.id,
    };

    const venue = await venueResolver?.({}, args, {});
    const expectedVenue = await Venue.findById(testVenue?._id)
      .populate("organizationId")
      .lean();
    expect(venue).toEqual(expectedVenue);
  });
});
