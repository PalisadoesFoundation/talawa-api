import "dotenv/config";
import { createdBy as createdByResolver } from "../../../src/resolvers/Event/createdBy";
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
  it(`returns the creator user object for parent event`, async () => {
    const parent = testEvent!.toObject();

    const createdByPayload = await createdByResolver?.(parent, {}, {});

    const createdByObject = await User.findOne({
      _id: testUser!._id,
    }).lean();

    expect(createdByPayload).toEqual(createdByObject);
  });
});
