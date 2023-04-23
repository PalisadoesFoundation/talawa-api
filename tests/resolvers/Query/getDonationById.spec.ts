import "dotenv/config";
import { connect, disconnect } from "../../helpers/db";
import { getDonationById as getDonationByIdResolver } from "../../../src/resolvers/Query/getDonationById";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { QueryGetDonationByIdArgs } from "../../../src/types/generatedGraphQLTypes";
import { TestDonationType, createTestDonation } from "../../helpers/donation";
import mongoose from "mongoose";

let MONGOOSE_INSTANCE: typeof mongoose;
let testDonation: TestDonationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestDonation();
  testDonation = resultArray[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> getDonationById", () => {
  it(`returns the donation with _id === args.id`, async () => {
    const args: QueryGetDonationByIdArgs = {
      id: testDonation?._id,
    };

    const getDonationByIdPayload = await getDonationByIdResolver?.(
      {},
      args,
      {}
    );

    expect(getDonationByIdPayload).toEqual(testDonation?.toObject());
  });
});
