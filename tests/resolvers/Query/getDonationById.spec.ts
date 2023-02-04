import "dotenv/config";
import {
  User,
  Organization,
  Donation,
  Interface_Donation,
} from "../../../src/models";
import { connect, disconnect } from "../../../src/db";
import { getDonationById as getDonationByIdResolver } from "../../../src/resolvers/Query/getDonationById";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { QueryGetDonationByIdArgs } from "../../../src/types/generatedGraphQLTypes";
import { Document } from "mongoose";

let testDonation: Interface_Donation & Document<any, any, Interface_Donation>;

beforeAll(async () => {
  await connect("TALAWA_TESING_DB");

  const testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });

  const testOrganization = await Organization.create({
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

  testDonation = await Donation.create({
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

describe("resolvers -> Mutation -> getDonationById", () => {
  it(`returns the donation with _id === args.id`, async () => {
    const args: QueryGetDonationByIdArgs = {
      id: testDonation._id,
    };

    const getDonationByIdPayload = await getDonationByIdResolver?.(
      {},
      args,
      {}
    );

    expect(getDonationByIdPayload).toEqual(testDonation.toObject());
  });
});
