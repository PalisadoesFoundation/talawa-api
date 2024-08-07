import type mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { USER_NOT_AUTHORIZED_ERROR } from "../../../src/constants";
import {
  type InterfaceUser,
  AppUserProfile,
  type InterfaceFundraisingCampaign,
} from "../../../src/models";

import { getPledgesByUserId } from "../../../src/resolvers/Query/getPledgesByUserId";
import { connect, disconnect } from "../../helpers/db";
import type { TestUserType } from "../../helpers/userAndOrg";
import type { TestPledgeType } from "../../helpers/FundraisingCampaignPledge";
import { createTestFundraisingCampaignPledge } from "../../helpers/FundraisingCampaignPledge";
import type { InterfaceFundraisingCampaignPledges } from "../../../src/models/FundraisingCampaignPledge";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testCampaign: InterfaceFundraisingCampaign;
let testPledge: TestPledgeType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const { requestContext } = await import("../../../src/libraries");

  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message,
  );

  const temp = await createTestFundraisingCampaignPledge();
  testUser = temp[0];
  testPledge = temp[4];
  testCampaign = temp[3];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers->Query->getPledgesByUserId", () => {
  it("Returns all the pledges belonging to specific userId", async () => {
    const args = { userId: testUser?._id.toString() };
    const context = { userId: testUser?._id.toString() };

    const result = (await getPledgesByUserId?.(
      {},
      args,
      context,
    )) as InterfaceFundraisingCampaignPledges[];
    expect(result[0]._id).toEqual(testPledge?._id);
  });

  it("Returns all the pledges belonging to specific userId with where.name_contains", async () => {
    const args = {
      userId: testUser?._id.toString(),
      where: { name_contains: testCampaign.name },
    };
    const context = { userId: testUser?._id.toString() };

    const result = (await getPledgesByUserId?.(
      {},
      args,
      context,
    )) as InterfaceFundraisingCampaignPledges[];
    const campaign = result[0].campaign as InterfaceFundraisingCampaign;
    expect(campaign._id).toEqual(testCampaign._id);
  });

  it("Returns all the pledges belonging to specific userId with where.name_contains not equal", async () => {
    const args = {
      userId: testUser?._id.toString(),
      where: { name_contains: testCampaign.name + "a" },
    };
    const context = { userId: testUser?._id.toString() };

    const result = (await getPledgesByUserId?.(
      {},
      args,
      context,
    )) as InterfaceFundraisingCampaignPledges[];
    expect(result.length).toEqual(0);
  });

  it("Returns all the pledges belonging to specific userId with where.firstName_contains", async () => {
    const args = {
      userId: testUser?._id.toString(),
      where: { firstName_contains: testUser?.firstName },
    };
    const context = { userId: testUser?._id.toString() };

    const result = (await getPledgesByUserId?.(
      {},
      args,
      context,
    )) as InterfaceFundraisingCampaignPledges[];

    const user = result[0].users[0] as InterfaceUser;
    expect(user.firstName).toEqual(testUser?.firstName);
  });

  it("Returns all the pledges belonging to specific userId with where.firstName_contains not equal", async () => {
    const args = {
      userId: testUser?._id.toString(),
      where: { firstName_contains: testUser?.firstName + "a" },
    };
    const context = { userId: testUser?._id.toString() };

    const result = (await getPledgesByUserId?.(
      {},
      args,
      context,
    )) as InterfaceFundraisingCampaignPledges[];
    expect(result.length).toEqual(0);
  });

  it("throws an error if the user does not have appUserProfile", async () => {
    await AppUserProfile.deleteOne({ userId: testUser?._id });
    const args = { userId: testUser?._id.toString() };
    const context = { userId: testUser?._id.toString() };

    try {
      await getPledgesByUserId?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
});
