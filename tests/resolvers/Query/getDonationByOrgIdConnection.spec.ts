import "dotenv/config";
import { Donation } from "../../../src/models";
import { getDonationByOrgIdConnection as getDonationByOrgIdConnectionResolver } from "../../../src/resolvers/Query/getDonationByOrgIdConnection";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { QueryGetDonationByOrgIdConnectionArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import type { TestDonationType } from "../../helpers/donation";
import { createTestDonationsForOrganization } from "../../helpers/donation";
import type { TestOrganizationType } from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testDonations: TestDonationType[];
let testOrganization: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const testUserAndOrganization = await createTestUserAndOrganization();
  testOrganization = testUserAndOrganization[1];
  testDonations = await createTestDonationsForOrganization(testOrganization);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> getDonationByOrgIdConnection", () => {
  it(`returns donations filtered by
    args.where === { id: testDonations[2]._id }`, async () => {
    const args: QueryGetDonationByOrgIdConnectionArgs = {
      orgId: testOrganization?._id,
      where: {
        id: testDonations[2]?._id as string,
      },
    };

    const getDonationByOrgIdConnectionPayload =
      await getDonationByOrgIdConnectionResolver?.({}, args, {});

    const donationsByOrganization = await Donation.find({
      orgId: testOrganization?._id,
      _id: testDonations[2]?._id,
    }).lean();

    expect(getDonationByOrgIdConnectionPayload).toEqual(
      donationsByOrganization,
    );
  });

  it(`returns donations filtered by
    args.where === { id_not: testDonations[2]._id }`, async () => {
    const args: QueryGetDonationByOrgIdConnectionArgs = {
      orgId: testOrganization?._id,
      where: {
        id_not: testDonations[2]?._id as string,
      },
    };

    const getDonationByOrgIdConnectionPayload =
      await getDonationByOrgIdConnectionResolver?.({}, args, {});

    const donationsByOrganization = await Donation.find({
      orgId: testOrganization?._id,
      _id: { $ne: testDonations[2]?._id },
    }).lean();

    expect(getDonationByOrgIdConnectionPayload).toEqual(
      donationsByOrganization,
    );
  });

  it(`returns donations filtered by
  args.where === { id_in: testDonations[2]._id }`, async () => {
    const args: QueryGetDonationByOrgIdConnectionArgs = {
      orgId: testOrganization?._id,
      where: {
        id_in: [testDonations[2]?._id] as string[],
      },
    };

    const getDonationByOrgIdConnectionPayload =
      await getDonationByOrgIdConnectionResolver?.({}, args, {});

    const donationsByOrganization = await Donation.find({
      orgId: testOrganization?._id,
      _id: { $in: [testDonations[2]?._id] },
    }).lean();

    expect(getDonationByOrgIdConnectionPayload).toEqual(
      donationsByOrganization,
    );
  });

  it(`returns donations filtered by
args.where === { id_not_in: testDonations[2]._id }`, async () => {
    const args: QueryGetDonationByOrgIdConnectionArgs = {
      orgId: testOrganization?._id,
      where: {
        id_not_in: [testDonations[2]?._id] as string[],
      },
    };

    const getDonationByOrgIdConnectionPayload =
      await getDonationByOrgIdConnectionResolver?.({}, args, {});

    const donationsByOrganization = await Donation.find({
      orgId: testOrganization?._id,
      _id: { $nin: [testDonations[2]?._id] },
    }).lean();

    expect(getDonationByOrgIdConnectionPayload).toEqual(
      donationsByOrganization,
    );
  });

  it(`returns donations filtered by
args.where === { id_not_in: testDonations[2]._id }`, async () => {
    const args: QueryGetDonationByOrgIdConnectionArgs = {
      orgId: testOrganization?._id,
      where: {
        id_not_in: [testDonations[2]?._id] as string[],
      },
    };

    const getDonationByOrgIdConnectionPayload =
      await getDonationByOrgIdConnectionResolver?.({}, args, {});

    const donationsByOrganization = await Donation.find({
      orgId: testOrganization?._id,
      _id: { $nin: [testDonations[2]?._id] },
    }).lean();

    expect(getDonationByOrgIdConnectionPayload).toEqual(
      donationsByOrganization,
    );
  });

  it(`returns donations filtered by
  args.where === { name_of_user: testDonations[2].nameOfUser }`, async () => {
    const args: QueryGetDonationByOrgIdConnectionArgs = {
      orgId: testOrganization?._id,
      where: {
        name_of_user: testDonations[2]?.nameOfUser,
      },
    };

    const getDonationByOrgIdConnectionPayload =
      await getDonationByOrgIdConnectionResolver?.({}, args, {});

    const donationsByOrganization = await Donation.find({
      orgId: testOrganization?._id,
      nameOfUser: testDonations[2]?.nameOfUser,
    }).lean();

    expect(getDonationByOrgIdConnectionPayload).toEqual(
      donationsByOrganization,
    );
  });

  it(`returns donations filtered by
  args.where === { name_of_user_not: testDonations[2].nameOfUser }`, async () => {
    const args: QueryGetDonationByOrgIdConnectionArgs = {
      orgId: testOrganization?._id,
      where: {
        name_of_user_not: testDonations[2]?.nameOfUser,
      },
    };

    const getDonationByOrgIdConnectionPayload =
      await getDonationByOrgIdConnectionResolver?.({}, args, {});

    const donationsByOrganization = await Donation.find({
      orgId: testOrganization?._id,
      nameOfUser: { $ne: testDonations[2]?.nameOfUser },
    }).lean();

    expect(getDonationByOrgIdConnectionPayload).toEqual(
      donationsByOrganization,
    );
  });

  it(`returns donations filtered by
  args.where === { name_of_user_in: testDonations[2].nameOfUser }`, async () => {
    const args: QueryGetDonationByOrgIdConnectionArgs = {
      orgId: testOrganization?._id,
      where: {
        name_of_user_in: [testDonations[2]?.nameOfUser ?? ""],
      },
    };

    const getDonationByOrgIdConnectionPayload =
      await getDonationByOrgIdConnectionResolver?.({}, args, {});

    const donationsByOrganization = await Donation.find({
      orgId: testOrganization?._id,
      nameOfUser: { $in: [testDonations[2]?.nameOfUser ?? ""] },
    }).lean();

    expect(getDonationByOrgIdConnectionPayload).toEqual(
      donationsByOrganization,
    );
  });

  it(`returns donations filtered by
  args.where === { name_of_user_not_in: testDonations[2].nameOfUser }`, async () => {
    const args: QueryGetDonationByOrgIdConnectionArgs = {
      orgId: testOrganization?._id,
      where: {
        name_of_user_not_in: [testDonations[2]?.nameOfUser ?? ""],
      },
    };

    const getDonationByOrgIdConnectionPayload =
      await getDonationByOrgIdConnectionResolver?.({}, args, {});

    const donationsByOrganization = await Donation.find({
      orgId: testOrganization?._id,
      nameOfUser: { $nin: [testDonations[2]?.nameOfUser ?? ""] },
    }).lean();

    expect(getDonationByOrgIdConnectionPayload).toEqual(
      donationsByOrganization,
    );
  });

  it(`returns donations filtered by
  args.where === { name_of_user_contains: shortenedNameOfUser }`, async () => {
    const shortenedNameOfUser = testDonations[2]?.nameOfUser?.substring(2);

    const args: QueryGetDonationByOrgIdConnectionArgs = {
      orgId: testOrganization?._id,
      where: {
        name_of_user_contains: shortenedNameOfUser,
      },
    };

    const getDonationByOrgIdConnectionPayload =
      await getDonationByOrgIdConnectionResolver?.({}, args, {});

    const donationsByOrganization = await Donation.find({
      orgId: testOrganization?._id,
      nameOfUser: { $regex: shortenedNameOfUser, $options: "i" },
    }).lean();

    expect(getDonationByOrgIdConnectionPayload).toEqual(
      donationsByOrganization,
    );
  });

  it(`returns donations filtered by
  args.where === { name_of_user_starts_with: shortenedNameOfUser }`, async () => {
    const shortenedNameOfUser = testDonations[2]?.nameOfUser?.substring(0, 3);

    const args: QueryGetDonationByOrgIdConnectionArgs = {
      orgId: testOrganization?._id,
      where: {
        name_of_user_starts_with: shortenedNameOfUser,
      },
    };

    const getDonationByOrgIdConnectionPayload =
      await getDonationByOrgIdConnectionResolver?.({}, args, {});

    const regexp = new RegExp("^" + shortenedNameOfUser);

    const donationsByOrganization = await Donation.find({
      orgId: testOrganization?._id,
      nameOfUser: regexp,
    }).lean();

    expect(getDonationByOrgIdConnectionPayload).toEqual(
      donationsByOrganization,
    );
  });
});
