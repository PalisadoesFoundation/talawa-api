import "dotenv/config";
import { updatedBy as updatedByResolver } from "../../../src/resolvers/Event/updatedBy";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestEventWithRegistrants } from "../../helpers/eventsWithRegistrants";
import type { TestEventType } from "../../helpers/events";
import { User } from "../../../src/models";
import { type TestUserType } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let testUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , testEvent] = await createTestEventWithRegistrants();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Event -> organization", () => {
  it(`returns the updator user object for parent event`, async () => {
    const parent = testEvent!.toObject();

    const updatedByPayload = await updatedByResolver?.(parent, {}, {});

    const updatedByObject = await User.findOne({
      _id: testUser!._id,
    }).lean();

    expect(updatedByPayload).toEqual(updatedByObject);
  });
});
