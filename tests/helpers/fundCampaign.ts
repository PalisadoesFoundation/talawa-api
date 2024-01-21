import { nanoid } from "nanoid";
import { FundCampaign, type InterfaceFundCampaign } from "../../src/models";
import type { Document } from "mongoose";
import type { TestUserType } from "./user";
import { createTestUser } from "./user";

export type TestFundCampaignType =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (InterfaceFundCampaign & Document<any, any, InterfaceFundCampaign>) | null;

export const createTestFundCampaign = async (): Promise<
  [TestUserType, TestFundCampaignType]
> => {
  const testUser = await createTestUser();

  if (testUser) {
    const testFundCampaign = await FundCampaign.create({
      creatorId: testUser._id,
      goalAmount: Math.floor(Math.random() * 10000),
      currency: "USD",
      name: `fund${nanoid().toLowerCase()}`,
      endDate: new Date().toUTCString(),
    });
    return [testUser, testFundCampaign];
  } else {
    return [testUser, null];
  }
};
