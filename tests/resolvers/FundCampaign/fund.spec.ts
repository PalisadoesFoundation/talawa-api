import "dotenv/config";
import type mongoose from "mongoose";
import { parentFundId as fundResolver } from "../../../src/resolvers/FundCampaign/fund";
import { connect, disconnect } from "../../helpers/db";
import { beforeAll, afterAll, it, expect, describe } from "vitest";
import { createTestFundAndFundCampaign } from "../../helpers/fundCampaign";
import type { TestFundCampaignType } from "../../helpers/fundCampaign";
import { Fund } from "../../../src/models";
import { type TestFundType } from "../../helpers/fund";

let MONGOOSE_INSTANCE: typeof mongoose;
let testFundCampaign: TestFundCampaignType;
let testFund: TestFundType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, testFundCampaign, , testFund] = await createTestFundAndFundCampaign();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> FundCampaign -> fund", () => {
  it(`returns the parent fund for the fund campaign`, async () => {
    const parent = testFundCampaign?.toObject();

    const fundIdPayload = await fundResolver?.(parent?.parentFund, {}, {});

    const fundIdObject = await Fund.findOne({
      _id: testFund?._id,
    }).lean();

    expect(fundIdPayload).toEqual(fundIdObject);
  });
});
