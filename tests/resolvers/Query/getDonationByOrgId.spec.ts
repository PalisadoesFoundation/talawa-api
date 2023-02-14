import "dotenv/config";
import { Donation } from "../../../src/models";
import { connect, disconnect } from "../../../src/db";
import { getDonationByOrgId as getDonationByOrgIdResolver } from "../../../src/resolvers/Query/getDonationByOrgId";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { QueryGetDonationByOrgIdArgs } from "../../../src/types/generatedGraphQLTypes";
import { createTestDonation } from "../../helpers/donation";
import { testOrganizationType } from "../../helpers/userAndOrg";

let testOrganization: testOrganizationType;

beforeAll(async () => {
  await connect();
  const resultArray = await createTestDonation();
  testOrganization = resultArray[1];
});

afterAll(async () => {
  await disconnect();
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
