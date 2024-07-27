import { NotFoundError } from "./../../../src/libraries/errors/notFoundError";
import type { QueryVenueArgs } from "./../../../src/types/generatedGraphQLTypes";
import type { TestOrganizationType } from "./../../helpers/userAndOrg";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { createTestVenue } from "./../../helpers/venue";
import type { TestVenueType } from "./../../helpers/venue";
import { connect, disconnect } from "../../helpers/db";
import { Organization, Venue } from "../../../src/models";
import { venue as venueResolver } from "../../../src/resolvers/Query/venue";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  VENUE_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { fail } from "assert";

let MONGOOSE_INSTANCE: typeof mongoose;
let testOrganization: TestOrganizationType;
let testVenue: TestVenueType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creatorId: new Types.ObjectId().toString(),
    admins: [new Types.ObjectId().toString()],
    members: [new Types.ObjectId().toString()],
    visibleInSearch: true,
  });
  testVenue = await createTestVenue(new Types.ObjectId());
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> venue", () => {
  it(`throws NotFoundError for venue not found`, async () => {
    try {
      const args: QueryVenueArgs = {
        id: new Types.ObjectId().toString(),
      };

      await venueResolver?.({}, args, {});
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        expect(error.message).toEqual(VENUE_NOT_FOUND_ERROR.MESSAGE);
      } else {
        fail(`Expected NotFoundError, but got ${error}`);
      }
    }
  });

  it(`throws NotFoundError for organization not found`, async () => {
    try {
      const args: QueryVenueArgs = {
        id: testVenue?.id,
      };

      await venueResolver?.({}, args, {});
    } catch (error: unknown) {
      if (error instanceof NotFoundError) {
        expect(error.message).toEqual(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
      } else {
        fail(`Expected NotFoundError, but got ${error}`);
      }
    }
  });

  it(`returns venue object with organization populated`, async () => {
    await Venue.findOneAndUpdate(
      {
        _id: testVenue?._id,
      },
      {
        $set: { organization: testOrganization?._id },
      },
      { new: true },
    );

    const args: QueryVenueArgs = {
      id: testVenue?.id,
    };

    const venue = await venueResolver?.({}, args, {});
    const expectedVenue = await Venue.findById(testVenue?._id)
      .populate("organization")
      .lean();
    expect(venue).toEqual(expectedVenue);
  });
});
