import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  END_DATE_VALIDATION_ERROR,
  FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR,
  START_DATE_VALIDATION_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import {
  FundraisingCampaign,
  type InterfaceFundraisingCampaign,
} from "../../../src/models";
import { createFundraisingCampaignPledge } from "../../../src/resolvers/Mutation/createFundraisingCampaignPledge";
import type { MutationCreateFundraisingCampaignPledgeArgs } from "../../../src/types/generatedGraphQLTypes";
import { createTestFundraisingCampaignPledge } from "../../helpers/FundraisingCampaignPledge";
import { connect, disconnect } from "../../helpers/db";
import type { TestUserType } from "../../helpers/user";
let testUser: TestUserType;
// let testfund: TestFundType;
let testFundraisingCampaign: InterfaceFundraisingCampaign;
let MONGOOSE_INSTANCE: typeof mongoose;
beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const { requestContext } = await import("../../../src/libraries");

  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );
  const temp = await createTestFundraisingCampaignPledge();
  testUser = temp[0];
  testFundraisingCampaign = temp[3];
  // testfund = temp[2];
});
afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});
describe("resolvers->Mutation->createFundraisingCampaignPledge", () => {
  it("throw error if no user exists with _id===context.userId", async () => {
    try {
      const args: MutationCreateFundraisingCampaignPledgeArgs = {
        data: {
          campaignId: testFundraisingCampaign._id.toString(),
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          userIds: [testUser!._id.toString()],
          startDate: new Date(new Date().toDateString()),
          endDate: new Date(new Date().toDateString()),
          currency: "USD",
          amount: 1000,
        },
      };
      const context = {
        userId: new Types.ObjectId().toString(),
      };
      await createFundraisingCampaignPledge?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it("throw error if no campaign exists with _id===args.data.campaignId", async () => {
    try {
      const args: MutationCreateFundraisingCampaignPledgeArgs = {
        data: {
          campaignId: new Types.ObjectId().toString(),
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          userIds: [testUser!._id.toString()],
          startDate: new Date(new Date().toDateString()),
          endDate: new Date(new Date().toDateString()),
          currency: "USD",
          amount: 1000,
        },
      };
      const context = {
        userId: testUser?._id,
      };
      await createFundraisingCampaignPledge?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });
  it("throws error if startDate is invalid", async () => {
    try {
      const args: MutationCreateFundraisingCampaignPledgeArgs = {
        data: {
          campaignId: testFundraisingCampaign._id.toString(),
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          userIds: [testUser!._id.toString()],
          startDate: "Tue Feb 13 2023",
          endDate: new Date(new Date().toDateString()),
          currency: "USD",
          amount: 1000,
        },
      };
      const context = {
        userId: testUser?._id,
      };
      await createFundraisingCampaignPledge?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        START_DATE_VALIDATION_ERROR.MESSAGE,
      );
    }
  });
  it("throws error if endDate is invalid", async () => {
    try {
      const args: MutationCreateFundraisingCampaignPledgeArgs = {
        data: {
          campaignId: testFundraisingCampaign._id.toString(),
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          userIds: [testUser!._id.toString()],
          startDate: new Date(new Date().toDateString()),
          endDate: "Tue Feb 13 2023",
          currency: "USD",
          amount: 1000,
        },
      };
      const context = {
        userId: testUser?._id,
      };
      await createFundraisingCampaignPledge?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        END_DATE_VALIDATION_ERROR.MESSAGE,
      );
    }
  });
  it("set startDate and endDate to campaign's startDate and endDate if not provided", async () => {
    const args: MutationCreateFundraisingCampaignPledgeArgs = {
      data: {
        campaignId: testFundraisingCampaign._id.toString(),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        userIds: [testUser!._id.toString()],
        currency: "USD",
        amount: 1000,
      },
    };
    const context = {
      userId: testUser?._id,
    };
    const pledge = await createFundraisingCampaignPledge?.({}, args, context);
    expect(pledge?.startDate).toEqual(testFundraisingCampaign.startDate);
    expect(pledge?.endDate).toEqual(testFundraisingCampaign.endDate);
  });
  it("creates the fundraisingCampaignPledge", async () => {
    const args: MutationCreateFundraisingCampaignPledgeArgs = {
      data: {
        campaignId: testFundraisingCampaign._id.toString(),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        userIds: [testUser!._id.toString()],
        startDate: new Date(new Date().toDateString()),
        endDate: new Date(new Date().toDateString()),
        currency: "USD",
        amount: 1000,
      },
    };
    const context = {
      userId: testUser?._id,
    };
    const pledge = await createFundraisingCampaignPledge?.({}, args, context);
    expect(pledge?.amount).toEqual(1000);
    const campaign = await FundraisingCampaign.findOne({
      _id: testFundraisingCampaign._id,
    }).lean();
    expect(campaign?.pledges).toContainEqual(pledge?._id);
  });
});
