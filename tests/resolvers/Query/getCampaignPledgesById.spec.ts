import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getFundraisingCampaignPledgeById } from "../../../src/resolvers/Query/getFundraisingCampaignPledgeById";
import {
  createTestFundraisingCampaignPledge,
  type TestPledgeType,
} from "../../helpers/FundraisingCampaignPledge";
import { connect, disconnect } from "../../helpers/db";
let MONGOOSE_INSTANCE: typeof mongoose;

let testPledge: TestPledgeType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestFundraisingCampaignPledge();

  testPledge = resultArray[4];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});
describe("resolvers->Query->getFundCampaignPledgebyId", () => {
  it(`returns the pledge with _id === args.id`, async () => {
    const args = {
      id: testPledge?._id.toString() || "",
    };
    const getFundCampaignPledgeByIdPayload =
      await getFundraisingCampaignPledgeById?.({}, args, {});

    expect(getFundCampaignPledgeByIdPayload?._id).toEqual(testPledge?._id);
  });
  it(`returns null if campaign not found for args.id`, async () => {
    const args = {
      id: new Types.ObjectId().toString(),
    };
    const getFundCampaignPledgeByIdPayload =
      await getFundraisingCampaignPledgeById?.({}, args, {});
    expect(getFundCampaignPledgeByIdPayload).toEqual({});
  });
});
