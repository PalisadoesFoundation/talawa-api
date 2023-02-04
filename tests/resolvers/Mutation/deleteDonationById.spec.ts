import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  User,
  Organization,
  Interface_Donation,
  Donation,
} from "../../../src/models";
import { MutationDeleteDonationByIdArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { deleteDonationById as deleteDonationByIdResolver } from "../../../src/resolvers/Mutation/deleteDonationById";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testDonation: Interface_Donation & Document<any, any, Interface_Donation>;

beforeAll(async () => {
  await connect("TALAWA_TESTING_DB");

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

describe("resolvers -> Mutation -> deleteDonationById", () => {
  it(`returns false if deletion of donation was unsuccessful`, async () => {
    const args: MutationDeleteDonationByIdArgs = {
      id: Types.ObjectId().toString(),
    };

    const deleteDonationByIdPayload = await deleteDonationByIdResolver?.(
      {},
      args,
      {}
    );

    expect(deleteDonationByIdPayload).toEqual({
      success: false,
    });
  });

  it(`returns true if deletion of donation was successful`, async () => {
    const args: MutationDeleteDonationByIdArgs = {
      id: testDonation._id,
    };

    const deleteDonationByIdPayload = await deleteDonationByIdResolver?.(
      {},
      args,
      {}
    );

    expect(deleteDonationByIdPayload).toEqual({
      success: true,
    });
  });
});
