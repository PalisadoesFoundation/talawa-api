import {
  AppUserProfile,
  FundraisingCampaign,
  type InterfaceFundraisingCampaign,
} from "../../src/models";
import {
  FundraisingCampaignPledge,
  type InterfaceFundraisingCampaignPledges,
} from "../../src/models/FundraisingCampaignPledge";
import { createTestFund, type TestFundType } from "./Fund";
import { createTestFundraisingCampaign } from "./FundraisingCampaign";
import type { TestOrganizationType, TestUserType } from "./userAndOrg";
export type TestPledgeType =
  | (InterfaceFundraisingCampaignPledges & Document)
  | null;

export const createTestFundraisingCampaignPledge = async (): Promise<
  [
    TestUserType,
    TestOrganizationType,
    TestFundType,
    InterfaceFundraisingCampaign,
    TestPledgeType,
  ]
> => {
  const userOrgAndFund = await createTestFund();
  const testUser = userOrgAndFund[0];
  const testOrganization = userOrgAndFund[1];
  const testFund = userOrgAndFund[2];
  let testFundraisingCampaign = await createTestFundraisingCampaign(
    testFund?._id,
    testOrganization?._id,
  );
  if (testUser && testOrganization && testFund && testFundraisingCampaign) {
    const testFundraisingCampaignPledge =
      (await FundraisingCampaignPledge.create({
        campaign: testFundraisingCampaign._id,
        users: [testUser._id.toString()],
        startDate: new Date(),
        endDate: new Date(),
        amount: 100,
        currency: "USD",
      })) as unknown as TestPledgeType;
    testFundraisingCampaign = (await FundraisingCampaign.findOneAndUpdate(
      {
        _id: testFundraisingCampaign._id,
      },
      {
        $push: {
          pledges: testFundraisingCampaignPledge?._id,
        },
      },
      {
        new: true,
      },
    )) as InterfaceFundraisingCampaign;

    await AppUserProfile.updateOne(
      {
        userId: testUser._id,
      },
      {
        $addToSet: {
          pledges: testFundraisingCampaignPledge?._id,
          campaigns: testFundraisingCampaign._id,
        },
      },
    );

    return [
      testUser,
      testOrganization,
      testFund,
      testFundraisingCampaign,
      testFundraisingCampaignPledge,
    ];
  } else {
    return [
      testUser,
      testOrganization,
      testFund,
      testFundraisingCampaign,
      null,
    ];
  }
};
