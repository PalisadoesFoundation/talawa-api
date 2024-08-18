import { nanoid } from "nanoid";
import {
  Fund,
  FundraisingCampaign,
  type InterfaceFundraisingCampaign,
} from "../../src/models";
import { Types } from "mongoose";

export type TestFundCampaignType =
  | (InterfaceFundraisingCampaign & Document)
  | null;

export const createTestFundraisingCampaign = async (
  fundId: string,
  organizationId?: Types.ObjectId | undefined,
  populated?: string[],
): Promise<InterfaceFundraisingCampaign> => {
  //   const [testUser, testOrganization, testFund] = await createTestFund();

  const testFundraisingCampaign = await FundraisingCampaign.create({
    name: `name${nanoid().toLowerCase()}`,
    fundId: fundId,
    organizationId: organizationId ?? new Types.ObjectId(),
    startDate: new Date(new Date().toDateString()),
    endDate: new Date(new Date().toDateString()),
    currency: "USD",
    fundingGoal: 1000,
    pledges: [],
  });
  await Fund.updateOne(
    {
      _id: fundId,
    },
    {
      $push: {
        campaigns: testFundraisingCampaign._id,
      },
    },
  );

  const finalFundraisingCampaign = await FundraisingCampaign.findOne({
    _id: testFundraisingCampaign._id,
  }).populate(populated || []);

  return finalFundraisingCampaign as InterfaceFundraisingCampaign;
};
