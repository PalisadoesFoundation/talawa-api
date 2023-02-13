import "dotenv/config";
import { me as meResolver } from "../../../src/resolvers/Query/me";
import { connect, disconnect } from "../../../src/db";
import { USER_NOT_FOUND } from "../../../src/constants";
import { User } from "../../../src/models";
import { Types } from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { testUserType } from "../../helpers/userAndOrg";
import { createTestEvent } from "../../helpers/events";

let testUser: testUserType;

beforeAll(async () => {
  await connect();
  testUser = (await createTestEvent())[0];
});

afterAll(async () => {
  disconnect();
});

describe("resolvers -> Query -> me", () => {
  it("throws NotFoundError if no user exists with _id === context.userId", async () => {
    try {
      const context = {
        userId: Types.ObjectId().toString(),
      };

      await meResolver?.({}, {}, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
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
