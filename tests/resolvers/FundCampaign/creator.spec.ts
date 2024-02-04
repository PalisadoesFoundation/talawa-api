import "dotenv/config";
import type mongoose from "mongoose";
import { creator as creatorResolver } from "../../../src/resolvers/FundCampaign/creator";
import { connect, disconnect } from "../../helpers/db";
import { beforeAll, afterAll, it, expect, describe } from "vitest";
import { type TestUserType } from "../../helpers/userAndOrg";
import { createTestFundAndFundCampaign } from "../../helpers/fundCampaign";
import type { TestFundCampaignType } from "../../helpers/fundCampaign";
import { User } from "../../../src/models";

let MONGOOSE_INSTANCE: typeof mongoose;
let testFundCampaign: TestFundCampaignType;
let testUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, testFundCampaign] = await createTestFundAndFundCampaign();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> FundCampaign -> creator", () => {
  it(`returns the creator user object for the parent fund campaign`, async () => {
    const parent = testFundCampaign?.toObject();

    const creatorIdPayload = await creatorResolver?.(parent?.creatorId, {}, {});

    const creatorIdObject = await User.findOne({
      _id: testUser?._id,
    }).lean();

    expect(creatorIdPayload).toEqual(creatorIdObject);
  });
});
