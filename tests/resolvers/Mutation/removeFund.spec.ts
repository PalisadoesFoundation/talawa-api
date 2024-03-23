import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  FUND_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { AppUserProfile, Fund, FundraisingCampaign } from "../../../src/models";
import { removeFund } from "../../../src/resolvers/Mutation/removeFund";
import type { TestFundType } from "../../helpers/Fund";
import { createTestFund } from "../../helpers/Fund";
import { createTestFundraisingCampaign } from "../../helpers/FundraisingCampaign";
import { connect, disconnect } from "../../helpers/db";
import { createTestUser } from "../../helpers/user";
import type { TestUserType } from "../../helpers/userAndOrg";
let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
// let testCampaign: TestFundCampaignType;
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
        userId: new Types.ObjectId().toString(),
      };
      await removeFund?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it("throw error if no fund exists with _id===args.id", async () => {
    try {
      const args = {
        id: new Types.ObjectId().toString(),
      };
      const context = {
        userId: testUser?._id,
      };
      await removeFund?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(FUND_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it("throw error if user is not admin of the organization", async () => {
    try {
      const args = {
        id: testFund?._id,
      };
      const randomUser = await createTestUser();
      const context = {
        userId: randomUser?._id,
      };
      await removeFund?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
  it("deletes the fund", async () => {
    const args = {
      id: testFund?._id,
    };
    const context = {
      userId: testUser?._id,
    };
    try {
      await removeFund?.({}, args, context);
      const fund = await Fund.findOne({ _id: testFund?._id });
      expect(fund).toBeNull();
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
  it("deletes all the campaigns associated with the fund", async () => {
    const temp = await createTestFund();
    const testfund2 = temp[2];
    const testUser2 = temp[0];
    const args = {
      id: testfund2?._id,
    };
    const context = {
      userId: testUser2?._id,
    };
    const campaign = await createTestFundraisingCampaign(testfund2?._id);

    try {
      await removeFund?.({}, args, context);
      const fund = await Fund.findOne({ _id: testfund2?._id });
      expect(fund).toBeNull();
      const campaignFound = await FundraisingCampaign.findOne({
        _id: campaign?._id,
      });

      expect(campaignFound).toBeNull();
    } catch (error) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });

  it("throws an error if the user does not have appUserProfile", async () => {
    await AppUserProfile.deleteOne({
      userId: testUser?._id,
    });
    const args = {
      id: testFund?._id,
    };

    const context = {
      userId: testUser?._id,
    };

    try {
      await removeFund?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
});
