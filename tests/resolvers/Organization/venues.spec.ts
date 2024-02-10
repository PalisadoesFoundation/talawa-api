import { TestVenueType, createTestVenue } from "./../../helpers/venue";
import "dotenv/config";
import { venues as venuesResolver } from "../../../src/resolvers/Organization/venues";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { Organization, User, Venue } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestOrganizationType } from "../../helpers/userAndOrg";
import { Types } from "mongoose";

let MONGOOSE_INSTANCE: typeof mongoose;
let testOrganization: TestOrganizationType;

let testVenue1: TestVenueType;
let testVenue2: TestVenueType;
let testVenue3: TestVenueType;

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
  testVenue1 = await createTestVenue(testOrganization?.id);
  testVenue2 = await createTestVenue(testOrganization?.id);
  testVenue3 = await createTestVenue(testOrganization?.id);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Organization -> venues", () => {
  it(`returns all venues in the organization`, async () => {
    const parent = testOrganization?.toObject();
    if (parent) {
      const venuesPayload = await venuesResolver?.(parent, {}, {});
      const venues = await Venue.find({
        organizationId: parent._id.toString(),
      }).lean();

      expect(venuesPayload).toEqual(venues);
    }
  });
});
