import "dotenv/config";
import { Document } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
  Interface_Organization,
} from "../../../src/models";
import { MutationCreateDonationArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { createDonation as createDonationResolver } from "../../../src/resolvers/Mutation/createDonation";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUser: Interface_User & Document<any, any, Interface_User>;
let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;

beforeAll(async () => {
  await connect();

  testUser = await User.create({
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
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> createDonation", () => {
  it(`creates the donation and returns it`, async () => {
    const args: MutationCreateDonationArgs = {
      amount: 1,
      nameOfOrg: testOrganization.name,
      nameOfUser: `${testUser.firstName} ${testUser.lastName}`,
      orgId: testOrganization._id,
      payPalId: "payPalId",
      userId: testUser._id,
    };

    const createDonationPayload = await createDonationResolver?.({}, args, {});

    expect(createDonationPayload).toEqual(
      expect.objectContaining({
        amount: 1,
        nameOfOrg: testOrganization.name,
        nameOfUser: `${testUser.firstName} ${testUser.lastName}`,
        orgId: testOrganization._id,
        payPalId: "payPalId",
        userId: testUser._id,
      })
    );
  });
});
