import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { USER_NOT_FOUND_ERROR } from "../../../src/constants";
import { User } from "../../../src/models";
import { me as meResolver } from "../../../src/resolvers/Query/me";
import { connect, disconnect } from "../../helpers/db";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestEvent } from "../../helpers/events";
import type { TestUserType } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = (await createTestEvent())[0];
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
});
