import "dotenv/config";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { Fund, FundCampaign, User } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestFundAndFundCampaign,
  type TestFundCampaignType,
} from "../../helpers/fundCampaign";
import {
  createTestUserAndOrganization,
  type TestOrganizationType,
  type TestUserType,
} from "../../helpers/userAndOrg";
import type { TestFundType } from "../../helpers/fund";

let testFundCampaign: TestFundCampaignType;
let testUser: TestUserType;
let testOrg: TestOrganizationType;
let testFund: TestFundType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const test = await createTestUserAndOrganization();
  testUser = test[0];
  testOrg = test[1];

  testFund = await Fund.create({
    creatorId: testUser?._id,
    organizationId: testOrg?._id,
    archived: false,
    taxDeductible: true,
    defaultFund: true,
    name: `testFund123456`,
  });

  const date: Date = new Date();
  date.setDate(date.getDate() + 2);

  testFundCampaign = await FundCampaign.create({
    creatorId: testUser?._id,
    goalAmount: Math.floor(Math.random() * 10000),
    currency: "USD",
    name: `fund$1234`,
    endDate: date,
    parentFund: testFund._id,
  });

  const newTestFund = await Fund.findByIdAndUpdate(
    {
      _id: testFund._id,
    },
    {
      $push: { campaigns: testFundCampaign._id },
    }
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> fund campaign -> parentFund", () => {
  it(`returns the fund object for child fund campaign`, async () => {
    const parent = testFundCampaign?.toObject();

    const { parentFundId: creatorResolver } = await import(
      "../../../src/resolvers/FundCampaign/fund"
    );
    if (parent) {
      await creatorResolver?.(parent, {}, {});
      const creatorPayload = await creatorResolver?.(parent, {}, {});
      const creator = await Fund.findOne({
        _id: testFundCampaign?.parentFund,
      }).lean();

      expect(creatorPayload).toEqual(creator);
    }
  });
});
