import type mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { User, type InterfaceUser } from "../../../src/models";
import { users as usersResolver } from "../../../src/resolvers/FundraisingCampaignPledge/users";
import {
  createTestFundraisingCampaignPledge,
  type TestPledgeType,
} from "../../helpers/FundraisingCampaignPledge";
import { connect, disconnect } from "../../helpers/db";
let MONGOOSE_INSTANCE: typeof mongoose;

let testPledge: TestPledgeType;
beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestFundraisingCampaignPledge();

  testPledge = temp[4];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});
describe("resolvers->FundrasingCampaignPledge->users", () => {
  it("returns  the  parent fund for  campaign", async () => {
    const parent = testPledge;
    if (parent) {
      const usersPayload = await usersResolver?.(parent, {}, {});
      const users = await User.find({
        _id: {
          $in: testPledge?.users?.map(String),
        },
      });

      expect(((await usersPayload) as InterfaceUser[])?.[0]?._id).toMatchObject(
        users[0]._id,
      );
    }
  });
});
