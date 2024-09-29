import "dotenv/config";
import { attendeesCheckInStatus as attendeesResolver } from "../../../src/resolvers/Event/attendeesCheckInStatus";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createEventWithCheckedInUser } from "../../helpers/checkIn";
import type { TestEventType } from "../../helpers/events";
import { EventAttendee } from "../../../src/models";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, , testEvent] = await createEventWithCheckedInUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Event -> attendeesCheckInStatus", () => {
  it(`returns the attendeesCheckInStatus object for parent event`, async () => {
    const parent = testEvent?.toObject();
    if (!parent) {
      throw new Error("Parent object is undefined.");
    }

    const payload = await attendeesResolver?.(parent, {}, {});

    const eventAttendeeObjects = await EventAttendee.find({
      eventId: testEvent?._id,
    })
      .populate("userId")
      .populate("checkInId")
      .lean();

    const statusObject = eventAttendeeObjects.map((obj) => ({
      user: obj.userId,
      _id: obj._id.toString(),
      checkIn: obj.checkInId,
    }));

    expect(payload).toEqual(statusObject);
  });
});
