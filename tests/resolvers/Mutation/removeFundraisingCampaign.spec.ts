import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR,
  FUND_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import {
  Fund,
  FundraisingCampaign,
  type InterfaceFundraisingCampaign,
} from "../../../src/models";
import { removeFundraisingCampaign } from "../../../src/resolvers/Mutation/removeFundraisingCampaign";
import type { TestFundType } from "../../helpers/Fund";
import { createTestFund } from "../../helpers/Fund";
import { createTestFundraisingCampaign } from "../../helpers/FundraisingCampaign";
import { connect, disconnect } from "../../helpers/db";
import { createTestUser } from "../../helpers/user";
import type { TestUserType } from "../../helpers/userAndOrg";
let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testCampaign: InterfaceFundraisingCampaign;
let testFund: TestFundType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const { requestContext } = await import("../../../src/libraries");

  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );

  const temp = await createTestFund();
  testUser = temp[0];
  testFund = temp[2];
  testCampaign = await createTestFundraisingCampaign(testFund?._id);
});
afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers->Mutation->removeFund", () => {
  it("throw error if no user exists with _id===context.userId", async () => {
    try {
      const args = {
        id: testFund?._id,
      };
      const context = {
        userId: Types.ObjectId().toString(),
      };
      await removeFundraisingCampaign?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it("throw error if no fund campaign exists with _id===args.id", async () => {
    try {
      const args = {
        id: Types.ObjectId().toString(),
      };
      const context = {
        userId: testUser?._id,
      };
      await removeFundraisingCampaign?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });
  it("throw error if user is not admin of the organization", async () => {
    try {
      const args = {
        id: testCampaign?._id.toString(),
      };
      const randomUser = await createTestUser();
      const context = {
        userId: randomUser?._id,
      };
      await removeFundraisingCampaign?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
  it("throws error if no fund exists with _id===campaign.fundId", async () => {
    try {
      const campaign = await createTestFundraisingCampaign(
        Types.ObjectId().toString(),
      );
      const args = {
        id: campaign?._id.toString() || "",
      };
      const context = {
        userId: testUser?._id,
      };
      await removeFundraisingCampaign?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(FUND_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it("deletes the fundraising campaing", async () => {
    const args = {
      id: testCampaign?._id.toString() || "",
    };
    const context = {
      userId: testUser?._id,
    };
    await removeFundraisingCampaign?.({}, args, context);
    const fund = await FundraisingCampaign.findOne({ _id: testFund?._id });
    expect(fund).toBeNull();
  });
  it("removes the campaign from the fund", async () => {
    testCampaign = await createTestFundraisingCampaign(testFund?._id);
    const args = {
      id: testCampaign?._id.toString() || "",
    };
    const context = {
      userId: testUser?._id,
    };
    await removeFundraisingCampaign?.({}, args, context);
    const fund = await Fund.findOne({ _id: testFund?._id });
    expect(fund?.campaigns).not.toContainEqual(testCampaign?._id);
  });
});
