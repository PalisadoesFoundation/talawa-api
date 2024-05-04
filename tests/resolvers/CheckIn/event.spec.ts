import "dotenv/config";
import type mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Event } from "../../../src/models";
import { event as eventResolver } from "../../../src/resolvers/CheckIn/event";
import {
  createEventWithCheckedInUser,
  type TestCheckInType,
} from "../../helpers/checkIn";
import { connect, disconnect } from "../../helpers/db";
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
    const parent = testCheckIn?.toObject();
    let eventPayload;
    if (parent) eventPayload = await eventResolver?.(parent, {}, {});

    const eventObject = await Event.findOne({
      _id: testEvent?._id,
    }).lean();

    expect(eventPayload).toEqual(eventObject);
  });
});
