import "dotenv/config";
import { Donation } from "../../../src/models";
import { connect, disconnect } from "../../../src/db";
import { getDonations as getDonationsResolver } from "../../../src/resolvers/Query/getDonations";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestDonation} from "../../helpers/donation";

beforeAll(async () => {
  await connect();
  const [testUser, testOrganization, testDonation] = await createTestDonation();
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
