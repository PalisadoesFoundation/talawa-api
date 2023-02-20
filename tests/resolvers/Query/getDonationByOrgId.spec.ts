import "dotenv/config";
import { Donation } from "../../../src/models";
import { getDonationByOrgId as getDonationByOrgIdResolver } from "../../../src/resolvers/Query/getDonationByOrgId";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { QueryGetDonationByOrgIdArgs } from "../../../src/types/generatedGraphQLTypes";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
import { createTestDonation } from "../../helpers/donation";
import { testOrganizationType } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testOrganization: testOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  const resultArray = await createTestDonation();
  testOrganization = resultArray[1];
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Mutation -> getDonationByOrgId", () => {
  it(`returns a list of all donations with orgId === args.orgId`, async () => {
    const args: QueryGetDonationByOrgIdArgs = {
      orgId: testOrganization?._id,
    };

    const getDonationByOrgIdPayload = await getDonationByOrgIdResolver?.(
      {},
      args,
      {}
    );

    const donationsByOrganization = await Donation.find({
      orgId: testOrganization?._id,
    }).lean();

    expect(getDonationByOrgIdPayload).toEqual(donationsByOrganization);
  });
});
