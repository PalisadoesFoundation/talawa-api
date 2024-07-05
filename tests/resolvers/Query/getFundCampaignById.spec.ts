import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { InterfaceFundraisingCampaign } from "../../../src/models";
import { getFundraisingCampaignById } from "../../../src/resolvers/Query/getFundraisingCampaign";
import { createTestFund, type TestFundType } from "../../helpers/Fund";
import { createTestFundraisingCampaign } from "../../helpers/FundraisingCampaign";
import { connect, disconnect } from "../../helpers/db";
<<<<<<< HEAD
=======
import { FundraisingCampaignPledge } from "../../../src/models/FundraisingCampaignPledge";

>>>>>>> develop
let MONGOOSE_INSTANCE: typeof mongoose;
let testFund: TestFundType;
let testCampaign: InterfaceFundraisingCampaign;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestFund();
  testFund = resultArray[2];
  testCampaign = await createTestFundraisingCampaign(testFund?._id);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});
describe("resolvers->Query->getFundCampaignById", () => {
  it(`returns the campaign with _id === args.id`, async () => {
    const args = {
      id: testCampaign?._id.toString(),
    };
<<<<<<< HEAD
=======
    const pledges = await FundraisingCampaignPledge.find({
      campaigns: testCampaign?._id,
    }).lean();
    console.log(pledges);
>>>>>>> develop
    const getFundCampaignByIdPayload = await getFundraisingCampaignById?.(
      {},
      args,
      {},
    );
<<<<<<< HEAD
    // console.log(getFundCampaignByIdPayload, testCampaign);
    expect(getFundCampaignByIdPayload?._id).toEqual(testCampaign._id);
  });
=======
    expect(getFundCampaignByIdPayload?._id).toEqual(testCampaign._id);
  });

>>>>>>> develop
  it(`returns null if campaign not found for args.id`, async () => {
    const args = {
      id: new Types.ObjectId().toString(),
    };
    const getFundCampaignByIdPayload = await getFundraisingCampaignById?.(
      {},
      args,
      {},
    );
    expect(getFundCampaignByIdPayload).toEqual({});
  });
});
