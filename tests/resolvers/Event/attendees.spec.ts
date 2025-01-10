import "dotenv/config";
import { attendees as attendeesResolver } from "../../../src/resolvers/Event/attendees";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestEventWithRegistrants } from "../../helpers/eventsWithRegistrants";
import type { TestUserType } from "../../helpers/userAndOrg";
import type { TestEventType } from "../../helpers/events";
import { User } from "../../../src/models";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testEvent: TestEventType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , testEvent] = await createTestEventWithRegistrants();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Event -> Attendees", () => {
  it(`returns the attendee user objects for parent event`, async () => {
    const parent = testEvent?.toObject();
    if (!parent) {
      throw new Error("Parent object is undefined.");
    }
    const attendeesPayload = await attendeesResolver?.(parent, {}, {});

    const attendeeObject = await User.findOne({
      _id: testUser?._id,
    }).lean();

    expect(attendeesPayload).toEqual([attendeeObject]);
  });
});
