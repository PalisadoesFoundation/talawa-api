import "dotenv/config";
import { User, Organization, Donation } from "../../../src/models";
import { connect, disconnect } from "../../../src/db";
import { getDonations as getDonationsResolver } from "../../../src/resolvers/Query/getDonations";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

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

describe("resolvers -> Mutation -> getDonations", () => {
  it(`returns a list of all existing donations`, async () => {
    const getDonationsPayload = await getDonationsResolver?.({}, {}, {});

    const donations = await Donation.find().lean();

    expect(getDonationsPayload).toEqual(donations);
  });
});
