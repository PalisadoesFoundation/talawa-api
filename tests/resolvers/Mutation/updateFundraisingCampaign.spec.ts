import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  END_DATE_VALIDATION_ERROR,
  FUNDRAISING_CAMPAIGN_ALREADY_EXISTS,
  FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR,
  FUND_NOT_FOUND_ERROR,
  START_DATE_VALIDATION_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import {
  AppUserProfile,
  type InterfaceFundraisingCampaign,
} from "../../../src/models";
import { updateFundraisingCampaign } from "../../../src/resolvers/Mutation/updateFundraisingCampaign";
import type { MutationUpdateFundraisingCampaignArgs } from "../../../src/types/generatedGraphQLTypes";
import { createTestFund, type TestFundType } from "../../helpers/Fund";
import { createTestFundraisingCampaign } from "../../helpers/FundraisingCampaign";
import { connect, disconnect } from "../../helpers/db";
import type { TestUserType } from "../../helpers/user";
import { createTestUser } from "../../helpers/userAndOrg";

let testUser: TestUserType;
let testfund: TestFundType;
let testFundraisingCampaign: InterfaceFundraisingCampaign;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const { requestContext } = await import("../../../src/libraries");

  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );
  const temp = await createTestFund();
  testUser = temp[0];
  testfund = temp[2];
  testFundraisingCampaign = await createTestFundraisingCampaign(testfund?._id);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers->Mutation->updateFundrasingCampaign", () => {
  it("throw error if no user exists with _id===context.userId", async () => {
    try {
      const args: MutationUpdateFundraisingCampaignArgs = {
        id: testFundraisingCampaign?._id.toString() || "",
        data: {
          name: "testFundraisingCampaign",
          startDate: new Date(new Date().toDateString()),
          endDate: new Date(new Date().toDateString()),
          currency: "USD",
          fundingGoal: 1000,
        },
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      await updateFundraisingCampaign?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("throw error if no campaign exists with _id===args.id", async () => {
    try {
      const args: MutationUpdateFundraisingCampaignArgs = {
        id: new Types.ObjectId().toString() || "",
        data: {
          name: "testFundraisingCampaign",
          startDate: new Date(new Date().toDateString()),
          endDate: new Date(new Date().toDateString()),
          currency: "USD",
          fundingGoal: 1000,
        },
      };

      const context = {
        userId: testUser?._id,
      };

      await updateFundraisingCampaign?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        FUNDRAISING_CAMPAIGN_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it("throws error if no fund exists with _id===campaign.fundId", async () => {
    try {
      const campaign = await createTestFundraisingCampaign(
        new Types.ObjectId().toString(),
      );

      const args: MutationUpdateFundraisingCampaignArgs = {
        id: campaign?._id.toString() || "",
        data: {
          name: "testFundraisingCampaign",
          startDate: new Date(new Date().toDateString()),
          endDate: new Date(new Date().toDateString()),
          currency: "USD",
          fundingGoal: 1000,
        },
      };

      const context = {
        userId: testUser?._id,
      };

      await updateFundraisingCampaign?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(FUND_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("throw error if the user is not authorized to update the fundraisingCampaign", async () => {
    try {
      const args: MutationUpdateFundraisingCampaignArgs = {
        id: testFundraisingCampaign?._id.toString() || "",
        data: {
          name: "testFundraisingCampaign",
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

      await updateFundraisingCampaign?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });

  it("throws error if startDate is invalid", async () => {
    try {
      const args: MutationUpdateFundraisingCampaignArgs = {
        id: testFundraisingCampaign?._id.toString() || "",
        data: {
          name: "testFundraisingCampaign",
          startDate: "Tue Feb 13 2023",
          endDate: new Date(new Date().toDateString()),
          currency: "USD",
          fundingGoal: 1000,
        },
      };

      const context = {
        userId: testUser?._id,
      };

      await updateFundraisingCampaign?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        START_DATE_VALIDATION_ERROR.MESSAGE,
      );
    }
  });

  it("throws error if endDate is invalid", async () => {
    try {
      const args: MutationUpdateFundraisingCampaignArgs = {
        id: testFundraisingCampaign?._id.toString() || "",
        data: {
          name: "testFundraisingCampaign",
          startDate: new Date(new Date().toDateString()),
          endDate: "Tue Feb 13 2023",
          currency: "USD",
          fundingGoal: 1000,
        },
      };

      const context = {
        userId: testUser?._id,
      };

      await updateFundraisingCampaign?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        END_DATE_VALIDATION_ERROR.MESSAGE,
      );
    }
  });

  it("throws error if the campaign already exists with the same name", async () => {
    try {
      const args: MutationUpdateFundraisingCampaignArgs = {
        id: testFundraisingCampaign?._id.toString() || "",
        data: {
          name: testFundraisingCampaign?.name || "",
          startDate: new Date(new Date().toDateString()),
          endDate: new Date(new Date().toDateString()),
          currency: "USD",
          fundingGoal: 1000,
        },
      };

      const context = {
        userId: testUser?._id,
      };

      await updateFundraisingCampaign?.({}, args, context);
    } catch (error: unknown) {
      // console.log(error);
      expect((error as Error).message).toEqual(
        FUNDRAISING_CAMPAIGN_ALREADY_EXISTS.MESSAGE,
      );
    }
  });

  it("updates the fundraisingCampaign", async () => {
    const args: MutationUpdateFundraisingCampaignArgs = {
      id: testFundraisingCampaign?._id.toString() || "",
      data: {
        name: testFundraisingCampaign?.name + "2" || "",
        startDate: new Date(new Date().toDateString()),
        endDate: new Date(new Date().toDateString()),
        currency: "USD",
        fundingGoal: 1000,
      },
    };

    const context = {
      userId: testUser?._id,
    };
    const result = await updateFundraisingCampaign?.({}, args, context);

    expect(result?.name).toEqual(testFundraisingCampaign?.name + "2");
  });

  it("throws an error if the user does not have appUserProfile", async () => {
    await AppUserProfile.deleteOne({
      userId: testUser?._id,
    });

    const args: MutationUpdateFundraisingCampaignArgs = {
      id: testFundraisingCampaign?._id.toString() || "",
      data: {
        name: "testFundraisingCampaign",

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
      await updateFundraisingCampaign?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
});
