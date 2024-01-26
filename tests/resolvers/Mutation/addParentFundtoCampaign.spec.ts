import "dotenv/config";
import mongoose, { Types } from "mongoose";
import type { MutationAddParentFundtoCampaignArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import {
  FUND_CAMPAIGN_NOT_FOUND,
  PARENT_FUND_NOT_NULL,
  FUND_NOT_FOUND,
} from "../../../src/constants";

import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  vi,
  afterEach,
} from "vitest";

import type { TestFundCampaignType } from "../../helpers/fundCampaign";
import type { TestFundType } from "../../helpers/fund";
import { createTestFundAndFundCampaign } from "../../helpers/fundCampaign";
import type { TestUserType } from "../../helpers/user";

let testFund: TestFundType;
let testFundCampaign: TestFundCampaignType;
let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestFundAndFundCampaign();
  testUser = temp[0];
  testFundCampaign = temp[1];
  testFund = temp[3];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolver -> Mutation -> addParentFundtoCampaign", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it("throws error if the parent fund id does not exist", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);

    try {
      const args: MutationAddParentFundtoCampaignArgs = {
        data: {
          fundCampaignId: testFundCampaign?._id,
          parentFundId: Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: testUser?._id,
      };

      const { addParentFundtoCampaign } = await import(
        "../../../src/resolvers/Mutation/addParentFundtoCampaign"
      );

      await addParentFundtoCampaign?.({}, args, context);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(FUND_NOT_FOUND.MESSAGE);
      expect(error?.message).toEqual(FUND_NOT_FOUND.MESSAGE);
    }
  });

  it("throws error if the fund campaign id does not exist", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);

    try {
      const args: MutationAddParentFundtoCampaignArgs = {
        data: {
          fundCampaignId: new mongoose.Types.ObjectId().toString(),
          parentFundId: testFund?._id,
        },
      };

      const context = {
        userId: testUser?._id,
      };

      const { addParentFundtoCampaign } = await import(
        "../../../src/resolvers/Mutation/addParentFundtoCampaign"
      );

      await addParentFundtoCampaign?.({}, args, context);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(FUND_CAMPAIGN_NOT_FOUND.MESSAGE);
      expect(error?.message).toEqual(FUND_CAMPAIGN_NOT_FOUND.MESSAGE);
    }
  });

  it("throws error if the parent fund id is not null", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);

    try {
      const args: MutationAddParentFundtoCampaignArgs = {
        data: {
          fundCampaignId: testFundCampaign?._id,
          parentFundId: testFund?._id,
        },
      };

      const context = {
        userId: testUser?._id,
      };

      const { addParentFundtoCampaign } = await import(
        "../../../src/resolvers/Mutation/addParentFundtoCampaign"
      );

      await addParentFundtoCampaign?.({}, args, context);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(PARENT_FUND_NOT_NULL.MESSAGE);
      expect(error?.message).toEqual(PARENT_FUND_NOT_NULL.MESSAGE);
    }
  });
});
