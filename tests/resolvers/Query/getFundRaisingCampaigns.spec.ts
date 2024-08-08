import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { InterfaceFundraisingCampaign } from "../../../src/models";
import { getFundraisingCampaigns } from "../../../src/resolvers/Query/getFundraisingCampaigns";
import { createTestFund, type TestFundType } from "../../helpers/Fund";
import { createTestFundraisingCampaign } from "../../helpers/FundraisingCampaign";
import { connect, disconnect } from "../../helpers/db";
import { FundraisingCampaignPledge } from "../../../src/models/FundraisingCampaignPledge";

let MONGOOSE_INSTANCE: typeof mongoose;
let testFund: TestFundType;
let testCampaign: InterfaceFundraisingCampaign;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestFund();
  testFund = resultArray[2];
  testCampaign = await createTestFundraisingCampaign(
    testFund?._id,
    testFund?.organizationId,
    ["fundId"],
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers->Query->getFundraisingCampaigns", () => {
  it(`returns the campaign with _id === args.where.id`, async () => {
    const args = {
      where: {
        id: testCampaign?._id.toString(),
      },
    };
    const pledges = await FundraisingCampaignPledge.find({
      campaigns: testCampaign?._id,
    }).lean();
    console.log(pledges);
    const getFundraisingCampaignsPayload = (await getFundraisingCampaigns?.(
      {},
      args,
      {},
    )) as InterfaceFundraisingCampaign[];
    expect(getFundraisingCampaignsPayload[0]._id).toEqual(testCampaign._id);
  });

  it(`returns the campaign with belong to a organization`, async () => {
    const args = {
      where: {
        organizationId: testCampaign?.organizationId.toString(),
      },
    };
    const getFundraisingCampaignsPayload = (await getFundraisingCampaigns?.(
      {},
      args,
      {},
    )) as InterfaceFundraisingCampaign[];
    expect(getFundraisingCampaignsPayload[0]._id).toEqual(testCampaign._id);
  });

  it(`returns null if campaign not found for args.id`, async () => {
    const args = {
      where: {
        id: new Types.ObjectId().toString(),
      },
    };
    const getFundraisingCampaignsPayload = await getFundraisingCampaigns?.(
      {},
      args,
      {},
    );
    expect(getFundraisingCampaignsPayload).toEqual([]);
  });
});
