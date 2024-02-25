import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  END_DATE_VALIDATION_ERROR,
  FUNDRAISING_CAMPAIGN_ALREADY_EXISTS,
  FUND_NOT_FOUND_ERROR,
  START_DATE_VALIDATION_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { Fund } from "../../../src/models";
import { createFundraisingCampaign } from "../../../src/resolvers/Mutation/createFundraisingCampaign";
import type { MutationCreateFundraisingCampaignArgs } from "../../../src/types/generatedGraphQLTypes";
import { createTestFund, type TestFundType } from "../../helpers/Fund";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import type { TestUserType } from "../../helpers/user";
import { createTestUser } from "../../helpers/userAndOrg";
let testUser: TestUserType;
let testfund: TestFundType;
// let testFundraisingCampaign: TestFundCampaignType;
let MONGOOSE_INSTANCE: typeof mongoose;
beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE);
  const { requestContext } = await import("../../../src/libraries");

  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );
  const temp = await createTestFund();
  testUser = temp[0];
  testfund = temp[2];
  //   const testFundraisingCampaign = await createTestFundraisingCampaign(
  //     testfund?._id,
  //   );
});
afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});
describe("resolvers->Mutation->createFundraisingCampaign", () => {
  it("throw error if no user exists with _id===context.userId", async () => {
    try {
      const args: MutationCreateFundraisingCampaignArgs = {
        data: {
          name: "testFundraisingCampaign",
          fundId: testfund?._id,
          startDate: new Date(new Date().toDateString()),
          endDate: new Date(new Date().toDateString()),
          currency: "USD",
          fundingGoal: 1000,
        },
      };
      const context = {
        userId: Types.ObjectId().toString(),
      };
      await createFundraisingCampaign?.({}, args, context);
    } catch (error: unknown) {
      //   console.log(error);
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it("throw error if no fund exists with _id===args.data.fundId", async () => {
    try {
      const args: MutationCreateFundraisingCampaignArgs = {
        data: {
          name: "testFundraisingCampaign",
          fundId: Types.ObjectId().toString(),
          startDate: new Date(new Date().toDateString()),
          endDate: new Date(new Date().toDateString()),
          currency: "USD",
          fundingGoal: 1000,
        },
      };
      const context = {
        userId: testUser?._id,
      };
      await createFundraisingCampaign?.({}, args, context);
    } catch (error: unknown) {
      //   console.log(error);
      expect((error as Error).message).toEqual(FUND_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it("throw error if the user is not authorized to create the fundraisingCampaign", async () => {
    try {
      const args: MutationCreateFundraisingCampaignArgs = {
        data: {
          name: "testFundraisingCampaign",
          fundId: testfund?._id,
          startDate: new Date(new Date().toDateString()),
          endDate: new Date(new Date().toDateString()),
          currency: "USD",
          fundingGoal: 1000,
        },
      };
      const randomUser = await createTestUser();
      const context = {
        userId: randomUser?._id,
      };

      await createFundraisingCampaign?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });

  it("throws error if startDate is invalid", async () => {
    try {
      const args: MutationCreateFundraisingCampaignArgs = {
        data: {
          name: "testFundraisingCampaign",
          fundId: testfund?._id,
          startDate: "Tue Feb 13 2023",
          endDate: new Date(new Date().toDateString()),
          currency: "USD",
          fundingGoal: 1000,
        },
      };
      const context = {
        userId: testUser?._id,
      };
      await createFundraisingCampaign?.({}, args, context);
    } catch (error: unknown) {
      //   console.log(error);
      expect((error as Error).message).toEqual(
        START_DATE_VALIDATION_ERROR.MESSAGE,
      );
    }
  });
  it("throws error if endDate is invalid", async () => {
    try {
      const args: MutationCreateFundraisingCampaignArgs = {
        data: {
          name: "testFundraisingCampaign",
          fundId: testfund?._id,
          startDate: new Date(new Date().toDateString()),
          endDate: "Tue Feb 13 2023",
          currency: "USD",
          fundingGoal: 1000,
        },
      };
      const context = {
        userId: testUser?._id,
      };
      await createFundraisingCampaign?.({}, args, context);
    } catch (error: unknown) {
      //   console.log(error);
      expect((error as Error).message).toEqual(
        END_DATE_VALIDATION_ERROR.MESSAGE,
      );
    }
  });
  it("creates the fundraisingCampaign", async () => {
    const args: MutationCreateFundraisingCampaignArgs = {
      data: {
        name: "testFundraisingCampaign",
        fundId: testfund?._id,
        startDate: new Date(new Date().toDateString()),
        endDate: new Date(new Date().toDateString()),
        currency: "USD",
        fundingGoal: 1000,
      },
    };
    const context = {
      userId: testUser?._id,
    };
    const result = await createFundraisingCampaign?.({}, args, context);
    console.log(result);
    const fund = await Fund.findOne({
      _id: result?.fundId?.toString() || "",
    });
    console.log(fund);
    expect(fund?.campaigns?.includes(result?._id)).toBeTruthy();
    expect(result).toBeTruthy();
  });
  it("throws error if the campaign already exists with the same name", async () => {
    try {
      const args: MutationCreateFundraisingCampaignArgs = {
        data: {
          name: "testFundraisingCampaign",
          fundId: testfund?._id,
          startDate: new Date(new Date().toDateString()),
          endDate: new Date(new Date().toDateString()),
          currency: "USD",
          fundingGoal: 1000,
        },
      };
      const context = {
        userId: testUser?._id,
      };
      await createFundraisingCampaign?.({}, args, context);
    } catch (error: unknown) {
      console.log(error);
      expect((error as Error).message).toEqual(
        FUNDRAISING_CAMPAIGN_ALREADY_EXISTS.MESSAGE,
      );
    }
  });
});
