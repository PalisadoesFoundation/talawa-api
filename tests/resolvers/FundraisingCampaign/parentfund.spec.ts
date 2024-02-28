import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Fund, type InterfaceFundraisingCampaign } from "../../../src/models";
import { fundId as fundResolvers } from "../../../src/resolvers/FundraisingCampagin/parentFund";
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
describe("resolvers->FundrasingCampaign->parentFund", () => {
  it("returns  the  parent fund for  campaign", async () => {
    const parent = testFundCampaigns;
    if (parent) {
      const fundPayload = await fundResolvers?.(parent, {}, {});
      const fund = await Fund.findOne({
        _id: Types.ObjectId(testFundCampaigns?.fundId?.toString()),
      }).lean();

      expect(fundPayload?._id).toEqual(fund?._id);
    }
  });
});
