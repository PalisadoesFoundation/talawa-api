import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import {
  USER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
} from "../../../src/constants";
import { AppUserProfile, User } from "../../../src/models";
import { me as meResolver } from "../../../src/resolvers/Query/me";
import { connect, disconnect } from "../../helpers/db";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestEvent } from "../../helpers/events";
import type { TestUserType } from "../../helpers/userAndOrg";
import { deleteUserFromCache } from "../../../src/services/UserCache/deleteUserFromCache";
import { FundraisingCampaignPledge } from "../../../src/models/FundraisingCampaignPledge";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = (await createTestEvent())[0];
  await deleteUserFromCache(testUser?._id);
  const pledges = await FundraisingCampaignPledge.find({
    _id: new Types.ObjectId(),
  }).lean();
  console.log(pledges);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> me", () => {
  it("throws NotFoundError if no user exists with _id === context.userId", async () => {
    try {
      const context = {
        userId: new Types.ObjectId().toString(),
      };

      await meResolver?.({}, {}, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.DESC);
    }
  });

  it(`returns user object with populated fields createdOrganizations
    , createdEvents, joinedOrganizations, registeredEvents, eventAdmin,
    adminFor`, async () => {
    const context = {
      userId: testUser?._id,
    };

    const mePayload = await meResolver?.({}, {}, context);

    const user = await User.findOne({
      _id: testUser?._id,
    })
      .select(["-password"])
      .populate("joinedOrganizations")
      .populate("registeredEvents")
      .lean();

    expect(mePayload?.user).toEqual(user);
  });

  it("throws an error if user does not have appUserProfile", async () => {
    try {
      const context = {
        userId: testUser?._id,
      };
      await AppUserProfile.deleteOne({
        userId: testUser?._id,
      });
      await meResolver?.({}, {}, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_AUTHORIZED_ERROR.DESC);
    }
  });
});
