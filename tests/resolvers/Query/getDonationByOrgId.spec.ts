import "dotenv/config";
import { Donation } from "../../../src/models";
import { getDonationByOrgId as getDonationByOrgIdResolver } from "../../../src/resolvers/Query/getDonationByOrgId";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { QueryGetDonationByOrgIdArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { createTestDonation } from "../../helpers/donation";
import type { TestOrganizationType } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testOrganization: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestDonation();
  testOrganization = resultArray[1];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> getDonationByOrgId", () => {
  it(`returns a list of all donations with orgId === args.orgId`, async () => {
    const args: QueryGetDonationByOrgIdArgs = {
      orgId: testOrganization?._id,
    };

    const getDonationByOrgIdPayload = await getDonationByOrgIdResolver?.(
      {},
      args,
      {},
    );

    const donationsByOrganization = await Donation.find({
      orgId: testOrganization?._id,
    }).lean();

    expect(getDonationByOrgIdPayload).toEqual(donationsByOrganization);
  });
});
