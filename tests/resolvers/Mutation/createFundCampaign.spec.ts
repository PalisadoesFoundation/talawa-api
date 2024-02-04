import "dotenv/config";
import type { MutationCreateFundCampaignArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { createFundCampaign as createFundCampaignResolver } from "../../../src/resolvers/Mutation/createFundCampaign";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestUserType } from "../../helpers/user";
import { createTestFundCampaign } from "../../helpers/fundCampaign";

let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultsArray = await createTestFundCampaign();

  testUser = resultsArray[0];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Muatation -> createFundCampaign", () => {
  it("creates the fundCampaign and returns it", async () => {
    const args: MutationCreateFundCampaignArgs = {
      data: {
        currency: "USD",
        goalAmount: 8910,
        name: "testFundCampaign",
        endDate: new Date(),
        startDate: Date.now(),
        parentFundId: new mongoose.Types.ObjectId().toString(),
        pledgeId: new mongoose.Types.ObjectId().toString(),
      },
    };

    const context = {
      userId: testUser?._id,
    };

    const createFundCampaignPayload = await createFundCampaignResolver?.(
      {},
      args,
      context
    );

    expect(createFundCampaignPayload).toEqual(
      expect.objectContaining({
        goalAmount: 8910,
        name: "testFundCampaign",
        currency: "USD",
        creatorId: testUser?._id,
      })
    );
  });
});
