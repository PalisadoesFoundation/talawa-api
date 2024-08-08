import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  FUNDRAISING_CAMPAIGN_ALREADY_ADDED,
  FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR,
  FUNDRAISING_CAMPAIGN_PLEDGE_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_MADE_PLEDGE_ERROR,
} from "../../../src/constants";
import {
  FundraisingCampaign,
  type InterfaceFundraisingCampaign,
} from "../../../src/models";
import { addPledgeToFundraisingCampaign } from "../../../src/resolvers/Mutation/addPledgeToFundraisingCampaign";
import type { MutationAddPledgeToFundraisingCampaignArgs } from "../../../src/types/generatedGraphQLTypes";
import type { TestFundType } from "../../helpers/Fund";
import { createTestFundraisingCampaign } from "../../helpers/FundraisingCampaign";
import {
  createTestFundraisingCampaignPledge,
  type TestPledgeType,
} from "../../helpers/FundraisingCampaignPledge";
import { connect, disconnect } from "../../helpers/db";
import { createTestUser, type TestUserType } from "../../helpers/userAndOrg";
let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testFund: TestFundType;
let testCampaign: InterfaceFundraisingCampaign;
let testCampaign2: InterfaceFundraisingCampaign;
let testPledge: TestPledgeType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const { requestContext } = await import("../../../src/libraries");

  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );

  const temp = await createTestFundraisingCampaignPledge();
  testUser = temp[0];
  testFund = temp[2];
  testPledge = temp[4];
  testCampaign = temp[3];
  testCampaign2 = await createTestFundraisingCampaign(
    testFund?._id,
    testFund?.organizationId,
  );
});
afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers->Mutation->addPledgeToFundraisingCampaign", () => {
  it("throw error if no user exists with _id===context.userId", async () => {
    try {
      const args: MutationAddPledgeToFundraisingCampaignArgs = {
        pledgeId: testPledge?._id.toString() || "",
        campaignId: testCampaign?._id.toString() || "",
      };
      const context = {
        userId: new Types.ObjectId().toString(),
      };
      await addPledgeToFundraisingCampaign?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it("throw error if no fund campaign pledge exists with _id===args.id", async () => {
    try {
      const args: MutationAddPledgeToFundraisingCampaignArgs = {
        pledgeId: new Types.ObjectId().toString(),
        campaignId: testCampaign?._id.toString() || "",
      };
      const context = {
        userId: testUser?._id,
      };
      await addPledgeToFundraisingCampaign?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        FUNDRAISING_CAMPAIGN_PLEDGE_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });
  it("throw error if no fund campaign exists with _id===args.id", async () => {
    try {
      const args: MutationAddPledgeToFundraisingCampaignArgs = {
        pledgeId: testPledge?._id.toString() || "",
        campaignId: new Types.ObjectId().toString(),
      };
      const context = {
        userId: testUser?._id,
      };
      await addPledgeToFundraisingCampaign?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });
  it("throw error if user has not made the pledge", async () => {
    try {
      const randomUser = await createTestUser();
      const args: MutationAddPledgeToFundraisingCampaignArgs = {
        pledgeId: testPledge?._id.toString() || "",
        campaignId: testCampaign?._id.toString() || "",
      };
      const context = {
        userId: randomUser?._id.toString() || "",
      };
      await addPledgeToFundraisingCampaign?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_MADE_PLEDGE_ERROR.MESSAGE,
      );
    }
  });
  it("throws error if pledge.campaigns.includes(campaign._id)", async () => {
    try {
      const args: MutationAddPledgeToFundraisingCampaignArgs = {
        pledgeId: testPledge?._id.toString() || "",
        campaignId: testCampaign?._id.toString() || "",
      };
      const context = {
        userId: testUser?._id.toString() || "",
      };
      await addPledgeToFundraisingCampaign?.({}, args, context);
    } catch (error: unknown) {
      //   console.log(error);
      expect((error as Error).message).toEqual(
        FUNDRAISING_CAMPAIGN_ALREADY_ADDED.MESSAGE,
      );
    }
  });
  it("add the campaign to the pledge", async () => {
    const args: MutationAddPledgeToFundraisingCampaignArgs = {
      pledgeId: testPledge?._id.toString() || "",
      campaignId: testCampaign2?._id.toString() || "",
    };
    const context = {
      userId: testUser?._id.toString() || "",
    };
    const pledge = await addPledgeToFundraisingCampaign?.({}, args, context);
    expect(pledge?.campaign).toEqual(testCampaign2?._id);
    const campaign = await FundraisingCampaign.findOne({
      _id: testCampaign2?._id,
    });
    expect(campaign?.pledges[0]?._id).toEqual(testPledge?._id);
  });
});
