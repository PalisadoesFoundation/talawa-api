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
import { AppUserProfile, Fund, FundraisingCampaign } from "../../../src/models";
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
          organizationId:
            testfund?.organizationId.toString() || "organizationId",
          startDate: new Date(new Date().toDateString()),
          endDate: new Date(new Date().toDateString()),
          currency: "USD",
          fundingGoal: 1000,
        },
      };
      const context = {
        userId: new Types.ObjectId().toString(),
      };
      await createFundraisingCampaign?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it("throw error if no fund exists with _id===args.data.fundId", async () => {
    try {
      const args: MutationCreateFundraisingCampaignArgs = {
        data: {
          name: "testFundraisingCampaign",
          fundId: new Types.ObjectId().toString(),
          organizationId:
            testfund?.organizationId.toString() || "organizationId",
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
      expect((error as Error).message).toEqual(FUND_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("throw error if the user is not authorized to create the fundraisingCampaign", async () => {
    try {
      const args: MutationCreateFundraisingCampaignArgs = {
        data: {
          name: "testFundraisingCampaign",
          fundId: testfund?._id,
          organizationId:
            testfund?.organizationId.toString() || "organizationId",
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
          organizationId:
            testfund?.organizationId.toString() || "organizationId",
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
          organizationId:
            testfund?.organizationId.toString() || "organizationId",
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
        organizationId: testfund?.organizationId.toString() || "organizationId",
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

    const fund = await Fund.findOne({
      _id: result?.fundId?.toString() || "",
    });
    expect(fund?.campaigns?.includes(result?._id)).toBeTruthy();
    expect(result).toBeTruthy();
  });

  it("throws error if Fundraising campaign already exist with the same name", async () => {
    try {
      const args: MutationCreateFundraisingCampaignArgs = {
        data: {
          name: "test",
          fundId: testfund?._id,
          organizationId:
            testfund?.organizationId.toString() || "organizationId",
          startDate: new Date(),
          endDate: new Date(new Date().toDateString()),
          currency: "USD",
          fundingGoal: 1000,
        },
      };
      // Creating Fundraising Campaign
      await FundraisingCampaign.create(args.data);
      const context = {
        userId: testUser?._id,
      };
      await createFundraisingCampaign?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        FUNDRAISING_CAMPAIGN_ALREADY_EXISTS.MESSAGE,
      );
    }
  });

  it("throws an error if user does not have appUserProfile", async () => {
    await AppUserProfile.deleteOne({
      userId: testUser?._id,
    });
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    const args: MutationCreateFundraisingCampaignArgs = {
      data: {
        name: "testFundraisingCampaign",
        fundId: testfund?._id,
        organizationId: testfund?.organizationId.toString() || "organizationId",
        startDate: new Date(new Date().toDateString()),
        endDate: new Date(new Date().toDateString()),
        currency: "USD",
        fundingGoal: 1000,
      },
    };
    const context = {
      userId: testUser?._id,
    };

    try {
      await createFundraisingCampaign?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
});
