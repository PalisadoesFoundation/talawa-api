import "dotenv/config";
import {
  User,
  Organization,
  Donation,
  Interface_Organization,
} from "../../../src/models";
import { connect, disconnect } from "../../../src/db";
import { getDonationByOrgId as getDonationByOrgIdResolver } from "../../../src/resolvers/Query/getDonationByOrgId";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { QueryGetDonationByOrgIdArgs } from "../../../src/types/generatedGraphQLTypes";
import { testDonationType, createTestDonation} from "../../helpers/donation";
import { testUserType, testOrganizationType } from "../../helpers/userAndOrg";

let testUser: testUserType;
let testOrganization: testOrganizationType;
let testDonation: testDonationType;

beforeAll(async () => {
  await connect();
  [testUser, testOrganization, testDonation] = await createTestDonation();
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> getDonationByOrgId", () => {
  it(`returns a list of all donations with orgId === args.orgId`, async () => {
    const args: QueryGetDonationByOrgIdArgs = {
      orgId: testOrganization._id,
    };

    const getDonationByOrgIdPayload = await getDonationByOrgIdResolver?.(
      {},
      args,
      {}
    );

    const donationsByOrganization = await Donation.find({
      orgId: testOrganization._id,
    }).lean();

    expect(getDonationByOrgIdPayload).toEqual(donationsByOrganization);
  });
});
