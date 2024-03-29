import { createTestVenue } from "./../../helpers/venue";
import "dotenv/config";
import { venues as venuesResolver } from "../../../src/resolvers/Organization/venues";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { Organization, Venue } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestOrganizationType } from "../../helpers/userAndOrg";
import { Types } from "mongoose";

let MONGOOSE_INSTANCE: typeof mongoose;
let testOrganization: TestOrganizationType;

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
  await createTestVenue(testOrganization?.id);
  await createTestVenue(testOrganization?.id);
  await createTestVenue(testOrganization?.id);
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
        organization: parent._id,
      }).lean();

      expect(venuesPayload).toEqual(venues);
    }
  });
});
