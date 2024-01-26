import { nanoid } from "nanoid";
import {
  CampaignPledge,
  Fund,
  FundCampaign,
  type InterfaceFundCampaign,
} from "../../src/models";
import type { Document } from "mongoose";
import type { TestUserType } from "./user";
import { createTestFund, type TestFundType } from "./fund";
import {
  createTestUserAndOrganization,
  type TestOrganizationType,
} from "./userAndOrg";
import type { TestCampaignPledgeType } from "./campaignPledge";

export type TestFundCampaignType =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (InterfaceFundCampaign & Document<any, any, InterfaceFundCampaign>) | null;

export const createTestFundCampaign = async (): Promise<
  [TestUserType, TestFundCampaignType, TestOrganizationType, TestFundType]
> => {
  const result = await createTestFund();
  const testUser = result[0];
  const testOrg = result[1];
  const testFund = result[2];
  const date: Date = new Date();
  date.setDate(date.getDate() + 2);

  if (testUser) {
    const testFundCampaign = await FundCampaign.create({
      creatorId: testUser._id,
      goalAmount: Math.floor(Math.random() * 10000),
      currency: "USD",
      name: `fund${nanoid().toLowerCase()}`,
      endDate: date,
      parentFund: testFund?._id,
    });

    await testFund?.update({ $push: { campaigns: testFundCampaign._id } });

    return [testUser, testFundCampaign, testOrg, testFund];
  } else {
    return [testUser, null, testOrg, testFund];
  }
};

export const createTestFundAndFundCampaign = async (): Promise<
  [
    TestUserType,
    TestFundCampaignType,
    TestOrganizationType,
    TestFundType,
    TestCampaignPledgeType
  ]
> => {
  const testUserandOrg = await createTestUserAndOrganization();

  const testUser = testUserandOrg[0];
  const testOrg = testUserandOrg[1];

  const date: Date = new Date();
  date.setDate(date.getDate() + 2);

  const testPledge = await CampaignPledge.create({
    creatorId: testUser?._id,
    amount: 90000,
    currency: "USD",
    endDate: date,
    members: [testUser?.id],
  });

  const testFund = await Fund.create({
    creatorId: testUser?._id,
    organizationId: testOrg?._id,
    archived: false,
    taxDeductible: true,
    defaultFund: true,
    name: `testFund${nanoid().toLowerCase()}`,
  });

  const testFundCampaign = await FundCampaign.create({
    creatorId: testUser?._id,
    goalAmount: 90000,
    currency: "USD",
    name: `fund${nanoid().toLowerCase()}`,
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

  const newTestPledge = await CampaignPledge.findByIdAndUpdate(
    {
      _id: testPledge._id,
    },
    {
      $push: { campaigns: testFundCampaign._id },
    }
  );

  return [testUser, testFundCampaign, testOrg, newTestFund, newTestPledge];
};
