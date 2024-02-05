import "dotenv/config";
import type mongoose from "mongoose";
import { pledgeId as pledgeResolver } from "../../../src/resolvers/FundCampaign/pledge";
import { connect, disconnect } from "../../helpers/db";
import { beforeAll, afterAll, it, expect, describe } from "vitest";
import { createTestFundAndFundCampaign } from "../../helpers/fundCampaign";
import type { TestFundCampaignType } from "../../helpers/fundCampaign";
import { CampaignPledge } from "../../../src/models";
import { type TestCampaignPledgeType } from "../../helpers/campaignPledge";

let MONGOOSE_INSTANCE: typeof mongoose;
let testFundCampaign: TestFundCampaignType;
let testPledge: TestCampaignPledgeType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, testFundCampaign, , , testPledge] = await createTestFundAndFundCampaign();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> FundCampaign -> pledge", () => {
  it(`returns the pledgeId for the fund campaign`, async () => {
    const parent = testFundCampaign?.toObject();

    const pledgeIdPayload = await pledgeResolver?.(parent?.pledgeId, {}, {});

    const pledgeIdObject = await CampaignPledge.findOne({
      _id: testPledge?._id,
    }).lean();

    expect(parent?.pledgeId).toEqual(testPledge?._id);
  });
});
