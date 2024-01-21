import "dotenv/config";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { FundCampaign } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { getFundCampaigns } from "../../../src/resolvers/Query/getFundCampaigns";
import { createTestFundCampaign } from "../../helpers/fundCampaign";

let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await createTestFundCampaign();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolver -> Query -> getFundCampaigns", () => {
  it("returns a list of all fund campaigns", async () => {
    const testfundCampaignsPayload = await getFundCampaigns?.({}, {}, {});
    const fundsCampaignsPayload = await FundCampaign.find().lean();

    expect(testfundCampaignsPayload).toMatchObject(fundsCampaignsPayload);
  });
});
