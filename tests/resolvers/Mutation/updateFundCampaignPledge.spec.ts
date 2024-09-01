import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  END_DATE_VALIDATION_ERROR,
  FUNDRAISING_CAMPAIGN_PLEDGE_NOT_FOUND_ERROR,
  START_DATE_VALIDATION_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { type InterfaceFundraisingCampaign } from "../../../src/models";
import { updateFundraisingCampaignPledge } from "../../../src/resolvers/Mutation/updateFundCampaignPledge";
import type { MutationUpdateFundraisingCampaignPledgeArgs } from "../../../src/types/generatedGraphQLTypes";
import {
  createTestFundraisingCampaignPledge,
  type TestPledgeType,
} from "../../helpers/FundraisingCampaignPledge";
import { connect, disconnect } from "../../helpers/db";
import type { TestUserType } from "../../helpers/user";
import { createTestUser } from "../../helpers/userAndOrg";

let testUser: TestUserType;
let testcampaignPledge: TestPledgeType;
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
  testcampaignPledge = temp[4];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers->Mutation->updateFundCampaignPledge", () => {
  it("throw error if no user exists with _id===context.userId", async () => {
    try {
      const args: MutationUpdateFundraisingCampaignPledgeArgs = {
        id: testFundraisingCampaign?._id.toString() || "",
        data: {
          startDate: new Date(new Date().toDateString()),
          endDate: new Date(new Date().toDateString()),
          currency: "USD",
          amount: 1000,
        },
      };
      const context = {
        userId: new Types.ObjectId().toString(),
      };
      await updateFundraisingCampaignPledge?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it("throw error if no plege exists with _id===args.id", async () => {
    try {
      const args: MutationUpdateFundraisingCampaignPledgeArgs = {
        id: new Types.ObjectId().toString() || "",
        data: {
          startDate: new Date(new Date().toDateString()),
          endDate: new Date(new Date().toDateString()),
          currency: "USD",
        },
      };
      const context = {
        userId: testUser?._id.toString() || "",
      };
      await updateFundraisingCampaignPledge?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        FUNDRAISING_CAMPAIGN_PLEDGE_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it("throws error if startDate is invalid", async () => {
    try {
      const args: MutationUpdateFundraisingCampaignPledgeArgs = {
        id: testcampaignPledge?._id.toString() || "",
        data: {
          startDate: "Tue Feb 13 2023",
          endDate: new Date(new Date().toDateString()),
          currency: "USD",
        },
      };

      const context = {
        userId: testUser?._id.toString(),
      };
      await updateFundraisingCampaignPledge?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        START_DATE_VALIDATION_ERROR.MESSAGE,
      );
    }
  });
  it("throws error if endDate is invalid", async () => {
    try {
      const args: MutationUpdateFundraisingCampaignPledgeArgs = {
        id: testcampaignPledge?._id.toString() || "",
        data: {
          startDate: new Date(new Date().toDateString()),
          endDate: "Tue Feb 13 2023",
          currency: "USD",
        },
      };

      const context = {
        userId: testUser?._id.toString(),
      };
      await updateFundraisingCampaignPledge?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        END_DATE_VALIDATION_ERROR.MESSAGE,
      );
    }
  });

  it("should update the pledge", async () => {
    const testUser2 = await createTestUser();
    const args: MutationUpdateFundraisingCampaignPledgeArgs = {
      id: testcampaignPledge?._id.toString() || "",
      data: {
        users: [testUser2?._id.toString()],
        startDate: new Date(new Date().toDateString()),
        endDate: new Date(new Date().toDateString()),
        currency: "USD",
        amount: 1000,
      },
    };
    const context = {
      userId: testUser?._id.toString(),
    };
    const pledge = await updateFundraisingCampaignPledge?.({}, args, context);
    expect(pledge).toBeTruthy();
    expect(pledge?.amount).toEqual(1000);
    expect(pledge?.currency).toEqual("USD");
    expect(pledge?.users[0]).toEqual(testUser2?._id);
    expect(pledge?.users).not.toContain(testUser?._id);
  });

  it("throws an error when an invalid user ID is provided", async () => {
    try {
      const args = {
        id: testcampaignPledge?._id.toString() || "",
        data: {
          users: [new Types.ObjectId().toString()],
        },
      };
      const context = {
        userId: testUser?._id.toString(),
      };
      await updateFundraisingCampaignPledge?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
});
