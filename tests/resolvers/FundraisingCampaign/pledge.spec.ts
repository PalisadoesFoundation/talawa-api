import type mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { InterfaceFundraisingCampaign } from "../../../src/models";
import { FundraisingCampaignPledge } from "../../../src/models/FundraisingCampaignPledge";
import { pledges as pledgesResolver } from "../../../src/resolvers/FundraisingCampagin/campaignPledges";
import { createTestFund, type TestFundType } from "../../helpers/Fund";
import { createTestFundraisingCampaign } from "../../helpers/FundraisingCampaign";
import { connect, disconnect } from "../../helpers/db";
let MONGOOSE_INSTANCE: typeof mongoose;
let testFund: TestFundType;
let testFundCampaigns: InterfaceFundraisingCampaign;
beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestFund();
  testFund = temp[2];
  testFundCampaigns = await createTestFundraisingCampaign(testFund?._id);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});
describe("resolvers->FundrasingCampaign->pledge", () => {
  it("returns all pledges for parent campaign", async () => {
    const parent = testFundCampaigns;
    if (parent) {
      const pledgesPayload = await pledgesResolver?.(parent, {}, {});
      const pledges = await FundraisingCampaignPledge.find({
        campaignId: testFundCampaigns?._id,
      }).lean();
      expect(pledgesPayload).toEqual(pledges);
    }
  });
});
