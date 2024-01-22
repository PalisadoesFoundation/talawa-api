import "dotenv/config";
import { creator as creatorResolver } from "../../../src/resolvers/FundCampaign/creator";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestFundCampaign } from "../../helpers/fundCampaign";
import { User } from "../../../src/models";
import type { TestUserType } from "../../helpers/user";
import type { TestFundCampaignType } from "../../helpers/fundCampaign";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testFundCampaign: TestFundCampaignType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestFundCampaign();
  testUser = temp[0];
  testFundCampaign = temp[1];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Event -> organization", () => {
  it(`returns the creator user object for parent event`, async () => {
    const parent = testFundCampaign?.toObject()._id;

    const creatorIdPayload = await creatorResolver?.(parent, {}, {});

    const creatorIdObject = await User.findOne({
      _id: testUser?._id,
    }).lean();

    expect(creatorIdPayload).toEqual(creatorIdObject);
  });
});
