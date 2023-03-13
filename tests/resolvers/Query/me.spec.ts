import "dotenv/config";
import { me as meResolver } from "../../../src/resolvers/Query/me";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { USER_NOT_FOUND_ERROR } from "../../../src/constants";
import { User } from "../../../src/models";
import { Types } from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { testUserType } from "../../helpers/userAndOrg";
import { createTestEvent } from "../../helpers/events";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testUser: testUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = (await createTestEvent())[0];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Query -> me", () => {
  it("throws NotFoundError if no user exists with _id === context.userId", async () => {
    try {
      const context = {
        userId: Types.ObjectId().toString(),
      };

      await meResolver?.({}, {}, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.DESC);
    }
  });

  it(`returns user object with populated fields createdOrganizations
    , createdEvents, joinedOrganizations, registeredEvents, eventAdmin,
    adminFor`, async () => {
    const context = {
      userId: testUser!._id,
    };

    const mePayload = await meResolver?.({}, {}, context);

    const user = await User.findOne({
      _id: testUser!._id,
    })
      .select(["-password"])
      .populate("createdOrganizations")
      .populate("createdEvents")
      .populate("joinedOrganizations")
      .populate("registeredEvents")
      .populate("eventAdmin")
      .populate("adminFor")
      .lean();

    expect(mePayload).toEqual(user);
  });
});
