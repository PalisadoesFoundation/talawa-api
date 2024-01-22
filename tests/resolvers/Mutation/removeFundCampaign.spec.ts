import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { FundCampaign } from "../../../src/models";
import type { MutationRemoveFundCampaignArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { FUND_CAMPAIGN_NOT_FOUND } from "../../../src/constants";

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
  it("throws NotFoundError if no fund campaign exist with _id === args.id", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationRemoveFundCampaignArgs = {
        id: Types.ObjectId().toString(),
      };
      const context = {
        userId: testUser?.id,
      };
      const { removeFundCampaign: removeFundCampaignResolver } = await import(
        "../../../src/resolvers/Mutation/removeFundCampaign"
      );

      await removeFundCampaignResolver?.({}, args, context);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      expect(spy).toHaveBeenCalledWith(FUND_CAMPAIGN_NOT_FOUND.MESSAGE);
      expect(error?.message).toEqual(
        `Translated ${FUND_CAMPAIGN_NOT_FOUND.MESSAGE}`
      );
    }
  });

  it("Deletes the fund campaign and returns it", async () => {
    const { removeFundCampaign } = await import(
      "../../../src/resolvers/Mutation/removeFundCampaign"
    );
    const removeFundCampaignPayload = await removeFundCampaign?.(
      {},
      { id: testFundCampaign?._id },
      { userId: testUser?._id }
    );

    expect(removeFundCampaignPayload).toHaveProperty(
      "creatorId",
      testUser?._id
    );
    expect(removeFundCampaignPayload).toHaveProperty(
      "_id",
      testFundCampaign?._id
    );
  });
});
