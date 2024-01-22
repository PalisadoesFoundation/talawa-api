import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { FundCampaign, User } from "../../../src/models";
import type { MutationUpdateFundCampaignArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import { updateFundCampaign as updateFundCampaignResolver } from "../../../src/resolvers/Mutation/updateFundCampaign";

import {
  FUND_CAMPAIGN_NOT_FOUND,
  START_DATE_VALIDATION_ERROR,
  END_DATE_VALIDATION_ERROR,
} from "../../../src/constants";

import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  afterEach,
  vi,
} from "vitest";

import type { TestUserType } from "../../helpers/user";
import { createTestFundCampaign } from "../../helpers/fundCampaign";
import type { TestFundCampaignType } from "../../helpers/fundCampaign";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testFundCampaign: TestFundCampaignType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestFundCampaign();
  testUser = temp[0];
  testFundCampaign = temp[1];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

afterEach(() => {
  vi.doUnmock("../../../src/constants");
  vi.resetModules();
});

describe("resovlers -> Mutation -> updateFundCampaign", () => {
  it("throws NotFoundError if no fund campaign exists with _id === args.id", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateFundCampaignArgs = {
        id: Types.ObjectId().toString(),
      };
      const context = {
        userId: testUser?.id,
      };
      const { updateFundCampaign: updateFundCampaignResolver } = await import(
        "../../../src/resolvers/Mutation/updateFundCampaign"
      );

      await updateFundCampaignResolver?.({}, args, context);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(FUND_CAMPAIGN_NOT_FOUND.DESC);
      expect(error?.message).toEqual(
        `Translated ${FUND_CAMPAIGN_NOT_FOUND.DESC}`
      );
      expect(error?.code).toEqual(FUND_CAMPAIGN_NOT_FOUND.CODE);
      expect(error?.param).toEqual(FUND_CAMPAIGN_NOT_FOUND.PARAM);
    }
  });

  it("updates the fund campaign with _id === args.id and returns the updated fund campaign", async () => {
    const date: Date = new Date();
    date.setDate(date.getDate() + 2);

    const tomorrow: Date = new Date();
    tomorrow.setDate(tomorrow.getDate() + 10);

    const args: MutationUpdateFundCampaignArgs = {
      id: testFundCampaign?._id,
      data: {
        currency: "INR",
        goalAmount: 7000,
        endDate: tomorrow,
        startDate: date,
        name: "UpdatedFund",
      },
    };

    const context = {
      userId: testUser?._id,
    };

    const updateFundCampaignPayload = await updateFundCampaignResolver?.(
      {},
      args,
      context
    );

    const updatedTestFundCampaign = await FundCampaign.findOne({
      _id: testFundCampaign?._id,
    }).lean();

    if (!updatedTestFundCampaign) {
      console.error("Updated advertisement not found in the database");
    } else {
      expect(updateFundCampaignPayload).toEqual(updatedTestFundCampaign);
    }
  });

  it("throws Date Validation error if start date is greater than end date", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );

    const date: Date = new Date();
    date.setDate(date.getDate() + 2);

    const previousDate: Date = new Date();
    previousDate.setDate(previousDate.getDate() - 10);

    try {
      const args: MutationUpdateFundCampaignArgs = {
        id: testFundCampaign?._id,
        data: {
          currency: "INR",
          goalAmount: 7000,
          endDate: previousDate,
          startDate: date,
          name: "UpdatedFund",
        },
      };
      const context = {
        userId: testUser?._id,
      };

      const { updateFundCampaign: updateFundCampaignResolver } = await import(
        "../../../src/resolvers/Mutation/updateFundCampaign"
      );

      await updateFundCampaignResolver?.({}, args, context);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      expect(error.message).toEqual(END_DATE_VALIDATION_ERROR.MESSAGE);
    }
  });

  it("throws Date Validation error if start date is less than current date", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );

    const date: Date = new Date();
    date.setDate(date.getDate() - 2);

    const tomorrow: Date = new Date();
    tomorrow.setDate(tomorrow.getDate() - 10);

    try {
      const args: MutationUpdateFundCampaignArgs = {
        id: testFundCampaign?._id,
        data: {
          currency: "INR",
          goalAmount: 7000,
          endDate: tomorrow,
          startDate: date,
          name: "UpdatedFund",
        },
      };
      const context = {
        userId: testUser?._id,
      };

      const { updateFundCampaign: updateFundCampaignResolver } = await import(
        "../../../src/resolvers/Mutation/updateFundCampaign"
      );

      await updateFundCampaignResolver?.({}, args, context);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      expect(error.message).toEqual(START_DATE_VALIDATION_ERROR.MESSAGE);
    }
  });
});
