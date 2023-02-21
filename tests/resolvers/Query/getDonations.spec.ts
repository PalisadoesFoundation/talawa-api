import "dotenv/config";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { Donation } from "../../../src/models";
import { getDonations as getDonationsResolver } from "../../../src/resolvers/Query/getDonations";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestDonation } from "../../helpers/donation";

let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await createTestDonation();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Mutation -> getDonations", () => {
  it(`returns a list of all existing donations`, async () => {
    const getDonationsPayload = await getDonationsResolver?.({}, {}, {});
    const donations = await Donation.find().lean();
    expect(getDonationsPayload).toEqual(donations);
  });
});
