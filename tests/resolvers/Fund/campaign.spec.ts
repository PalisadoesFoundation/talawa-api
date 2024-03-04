import type mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { FundraisingCampaign } from "../../../src/models";
import { campaigns as campaignsResolver } from "../../../src/resolvers/Fund/campaigns";
import { createTestFund, type TestFundType } from "../../helpers/Fund";
import { connect, disconnect } from "../../helpers/db";
let MONGOOSE_INSTANCE: typeof mongoose;
let testFund: TestFundType;
beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestFund();
  testFund = temp[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});
describe("resolvers->Fund->fundCampaign", () => {
  it("returns all campaigns for parent fund", async () => {
    const parent = testFund?.toObject();
    if (parent) {
      const campaignsPayload = await campaignsResolver?.(parent, {}, {});
      const campaigns = await FundraisingCampaign.find({
        fundId: testFund?._id,
      }).lean();
      expect(campaignsPayload).toEqual(campaigns);
    }
  });
});
