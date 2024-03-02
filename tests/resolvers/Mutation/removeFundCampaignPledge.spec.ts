import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  FUNDRAISING_CAMPAIGN_PLEDGE_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_MADE_PLEDGE_ERROR,
} from "../../../src/constants";
import {
  FundraisingCampaign,
  type InterfaceFundraisingCampaign,
} from "../../../src/models";
import { removeFundraisingCampaingPledge } from "../../../src/resolvers/Mutation/removeFundraisingCampaingPledge";
import type { MutationRemoveFundraisingCampaignPledgeArgs } from "../../../src/types/generatedGraphQLTypes";
import {
  createTestFundraisingCampaignPledge,
  type TestPledgeType,
} from "../../helpers/FundraisingCampaignPledge";
import { connect, disconnect } from "../../helpers/db";
import { createTestUser, type TestUserType } from "../../helpers/userAndOrg";
let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testCampaign: InterfaceFundraisingCampaign;

let testPledge: TestPledgeType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const { requestContext } = await import("../../../src/libraries");

  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );

  const temp = await createTestFundraisingCampaignPledge();
  testUser = temp[0];
  testPledge = temp[4];
  testCampaign = temp[3];
});
afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers->Mutation->removeFund", () => {
  it("throw error if no user exists with _id===context.userId", async () => {
    try {
      const args: MutationRemoveFundraisingCampaignPledgeArgs = {
        id: testPledge?._id.toString() || "",
      };
      const context = {
        userId: Types.ObjectId().toString(),
      };
      await removeFundraisingCampaingPledge?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it("throw error if no fund campaign pledge exists with _id===args.id", async () => {
    try {
      const args: MutationRemoveFundraisingCampaignPledgeArgs = {
        id: Types.ObjectId().toString(),
      };
      const context = {
        userId: testUser?._id,
      };
      await removeFundraisingCampaingPledge?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        FUNDRAISING_CAMPAIGN_PLEDGE_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });
  it("throw error if user has not made the pledge", async () => {
    try {
      const randomUser = await createTestUser();
      const args: MutationRemoveFundraisingCampaignPledgeArgs = {
        id: testPledge?._id.toString() || "",
      };
      const context = {
        userId: randomUser?._id.toString() || "",
      };
      await removeFundraisingCampaingPledge?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_MADE_PLEDGE_ERROR.MESSAGE,
      );
    }
  });
  it("remove the pledge", async () => {
    const args: MutationRemoveFundraisingCampaignPledgeArgs = {
      id: testPledge?._id.toString() || "",
    };
    const context = {
      userId: testUser?._id.toString() || "",
    };
    const pledge = await removeFundraisingCampaingPledge?.({}, args, context);
    expect(pledge?._id.toString()).toEqual(testPledge?._id.toString());
    const campaign = await FundraisingCampaign.findOne({
      _id: testCampaign?._id,
    });
    expect(campaign?.pledges).not.toContainEqual(testPledge?._id);
  });
});
