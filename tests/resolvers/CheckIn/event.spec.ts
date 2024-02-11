import "dotenv/config";
import { event as eventResolver } from "../../../src/resolvers/CheckIn/event";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { Event } from "../../../src/models";
import {
  createEventWithCheckedInUser,
  type TestCheckInType,
} from "../../helpers/checkIn";
import type { TestEventType } from "../../helpers/eventsWithRegistrants";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let testCheckIn: TestCheckInType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, , testEvent, testCheckIn] = await createEventWithCheckedInUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> CheckIn -> Event", () => {
  it(`returns the event object for parent post`, async () => {
    const parent = testCheckIn!.toObject();

    const eventPayload = await eventResolver?.(parent, {}, {});

    const eventObject = await Event.findOne({
      _id: testEvent!._id,
    }).lean();

    expect(eventPayload).toEqual(eventObject);
  });
});
