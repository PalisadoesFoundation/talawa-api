import "dotenv/config";
import { Venue } from "../../../src/models";
import { getVenueByOrgId as getVenueByOrgIdResolver } from "../../../src/resolvers/Query/getVenueByOrgId";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { QueryGetVenueByOrgIdArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import type { TestVenueType } from "../../helpers/venue";
import { createTestVenuesForOrganization } from "../../helpers/venue";
import type { TestOrganizationType } from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testVenues: TestVenueType[];
let testOrganization: TestOrganizationType;

describe("resolvers -> Query -> getVenueByOrgId", () => {
  beforeAll(async () => {
    MONGOOSE_INSTANCE = await connect();
    const testUserAndOrganization = await createTestUserAndOrganization();
    testOrganization = testUserAndOrganization[1];
    testVenues = await createTestVenuesForOrganization(testOrganization?._id);
  });

  afterAll(async () => {
    await disconnect(MONGOOSE_INSTANCE);
  });

  it(`returns venues filtered by args.where === { name_starts_with: testVenues[2].name }`, async () => {
    const shortenedNameOfVenue = testVenues[2]?.name?.substring(0, 3);
    const args: QueryGetVenueByOrgIdArgs = {
      orgId: testOrganization?._id,
      where: {
        name_starts_with: shortenedNameOfVenue,
      },
    };

    const getVenueByOrgId = await getVenueByOrgIdResolver?.({}, args, {});

    const venuesByOrganization = await Venue.find({
      organization: testOrganization?._id,
      name: new RegExp("^" + shortenedNameOfVenue),
    }).lean();

    expect(getVenueByOrgId).toEqual(venuesByOrganization);
  });

  it(`returns venues filtered by args.where === { name_contains: testVenues[2].name }`, async () => {
    const shortenedNameOfVenue = testVenues[2]?.name?.substring(2);
    const args: QueryGetVenueByOrgIdArgs = {
      orgId: testOrganization?._id,
      where: {
        name_contains: shortenedNameOfVenue,
      },
    };

    const getVenueByOrgId = await getVenueByOrgIdResolver?.({}, args, {});

    const venuesByOrganization = await Venue.find({
      organization: testOrganization?._id,
      name: { $regex: shortenedNameOfVenue, $options: "i" },
    }).lean();

    expect(getVenueByOrgId).toEqual(venuesByOrganization);
  });

  it(`returns venues filtered by args.where === { description_starts_with: testVenues[2].description }`, async () => {
    const shortenedDescOfVenue = testVenues[2]?.description?.substring(0, 3);
    const args: QueryGetVenueByOrgIdArgs = {
      orgId: testOrganization?._id,
      where: {
        description_starts_with: shortenedDescOfVenue,
      },
    };

    const getVenueByOrgId = await getVenueByOrgIdResolver?.({}, args, {});

    const venuesByOrganization = await Venue.find({
      organization: testOrganization?._id,
      description: new RegExp("^" + shortenedDescOfVenue),
    }).lean();

    expect(getVenueByOrgId).toEqual(venuesByOrganization);
  });

  it(`returns venues filtered by args.where === { description_contains: testVenues[2].description }`, async () => {
    const shortenedDescOfVenue = testVenues[2]?.description?.substring(2);
    const args: QueryGetVenueByOrgIdArgs = {
      orgId: testOrganization?._id,
      where: {
        description_contains: shortenedDescOfVenue,
      },
    };

    const getVenueByOrgId = await getVenueByOrgIdResolver?.({}, args, {});

    const venuesByOrganization = await Venue.find({
      organization: testOrganization?._id,
      description: { $regex: shortenedDescOfVenue, $options: "i" },
    }).lean();

    expect(getVenueByOrgId).toEqual(venuesByOrganization);
  });

  it(`return venues sorted by args.orderBy === capacity_DESC`, async () => {
    const args: QueryGetVenueByOrgIdArgs = {
      orgId: testOrganization?._id,
      orderBy: "capacity_DESC",
    };

    const getVenueByOrgId = await getVenueByOrgIdResolver?.({}, args, {});

    const venuesByOrganization = await Venue.find({
      organization: testOrganization?._id,
    })
      .sort({ capacity: -1 })
      .lean();

    expect(getVenueByOrgId).toEqual(venuesByOrganization);
  });

  it(`return venues sorted by args.orderBy === capacity_ASC`, async () => {
    const args: QueryGetVenueByOrgIdArgs = {
      orgId: testOrganization?._id,
      orderBy: "capacity_ASC",
    };

    const getVenueByOrgId = await getVenueByOrgIdResolver?.({}, args, {});

    const venuesByOrganization = await Venue.find({
      organization: testOrganization?._id,
    })
      .sort({ capacity: 1 })
      .lean();

    expect(getVenueByOrgId).toEqual(venuesByOrganization);
  });
});
