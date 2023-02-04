import "dotenv/config";
import {
  User,
  Organization,
  Donation,
  Interface_Organization,
} from "../../../src/models";
import { connect, disconnect } from "../../../src/db";
import { getDonationByOrgId as getDonationByOrgIdResolver } from "../../../src/resolvers/Query/getDonationByOrgId";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { QueryGetDonationByOrgIdArgs } from "../../../src/types/generatedGraphQLTypes";
import { Document } from "mongoose";

let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;

beforeAll(async () => {
  await connect("TALAWA_TESING_DB");

  const testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });

  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser._id,
    admins: [testUser._id],
    members: [testUser._id],
  });

  await User.updateOne(
    {
      _id: testUser._id,
    },
    {
      $push: {
        createdOrganizations: testOrganization._id,
        adminFor: testOrganization._id,
        joinedOrganizations: testOrganization._id,
      },
    }
  );

  await Donation.create({
    amount: 1,
    nameOfOrg: testOrganization.name,
    nameOfUser: `${testUser.firstName} ${testUser.lastName}`,
    orgId: testOrganization._id,
    payPalId: "payPalId",
    userId: testUser._id,
  });
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
