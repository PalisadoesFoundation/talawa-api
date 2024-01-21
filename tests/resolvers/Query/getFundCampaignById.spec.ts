import "dotenv/config";
import { connect, disconnect } from "../../helpers/db";
import { getFundCampaignById as getFundCampaignByIdResolver } from "../../../src/resolvers/Query/getFundCampaignById";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestFundCampaign } from "../../helpers/fundCampaign";
import type { QueryGetFundCampaignByIdArgs } from "../../../src/types/generatedGraphQLTypes";
import type { TestFundCampaignType } from "../../helpers/fundCampaign";
import mongoose from "mongoose";

let MONGOOSE_INSTANCE: typeof mongoose;
let testFundCampaign: TestFundCampaignType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestFundCampaign();
  testFundCampaign = resultArray[1];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resovler-> Query-> getFundCampaignById", () => {
  it("returns null if fund campaign is not found for args.id", async () => {
    const args: QueryGetFundCampaignByIdArgs = {
      id: new mongoose.Types.ObjectId().toString(),
    };

    const getFundCampaignByIdPayload = await getFundCampaignByIdResolver?.(
      {},
      args,
      {}
    );

    expect(getFundCampaignByIdPayload).toEqual(null);
  });

  it("returns the donation with _id === args.id", async () => {
    const args: QueryGetFundCampaignByIdArgs = {
      id: testFundCampaign?._id,
    };

    const getFundCampaignByIdPayload = await getFundCampaignByIdResolver?.(
      {},
      args,
      {}
    );

    expect(getFundCampaignByIdPayload).toEqual(testFundCampaign?.toObject());
  });
});
