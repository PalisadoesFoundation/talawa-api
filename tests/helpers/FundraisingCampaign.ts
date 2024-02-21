import { nanoid } from "nanoid";
import {
  FundraisingCampaign,
  type InterfaceFundraisingCampaign,
} from "../../src/models";

export type TestFundCampaignType =
  | (InterfaceFundraisingCampaign & Document)
  | null;

export const createTestFundraisingCampaign = async (
  fundId: string,
): Promise<InterfaceFundraisingCampaign> => {
  //   const [testUser, testOrganization, testFund] = await createTestFund();

  const testFundraisingCampaign = await FundraisingCampaign.create({
    name: `name${nanoid().toLowerCase()}`,
    fundId: fundId,
    startDate: new Date(new Date().toDateString()),
    endDate: new Date(new Date().toDateString()),
    currency: "USD",
    fundingGoal: 1000,
  });
  // await Fund.updateOne(
  //   {
  //     _id: fundId,
  //   },
  //   {
  //     $push: {
  //       campaigns: testFundraisingCampaign._id,
  //     },
  //   },
  // );

  return testFundraisingCampaign;
};
