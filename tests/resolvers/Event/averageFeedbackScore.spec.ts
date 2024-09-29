import "dotenv/config";
import type mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { averageFeedbackScore as averageFeedbackScoreResolver } from "../../../src/resolvers/Event/averageFeedbackScore";
import {
  createEventWithCheckedInUser,
  type TestCheckInType,
} from "../../helpers/checkIn";
import { connect, disconnect } from "../../helpers/db";
import type { TestEventType } from "../../helpers/events";
import { createFeedbackWithIDs } from "../../helpers/feedback";

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

describe("resolvers -> Event -> averageFeedbackScore", () => {
  it(`Should return 0 if there are no submitted feedbacks for the event`, async () => {
    if (!testEvent) throw new Error("testEvent is null");
    const parent = testEvent.toObject();

    const averageFeedbackScorePayload = await averageFeedbackScoreResolver?.(
      parent,
      {},
      {},
    );

    expect(averageFeedbackScorePayload).toEqual(0);
  });

  it(`Should return the proper average score if there are some submitted feedbacks for the event`, async () => {
    if (!testEvent) throw new Error("testEvent is null");
    if (!testCheckIn) throw new Error("testCheckIn is null");
    await createFeedbackWithIDs(
      testEvent._id.toString(),
      testCheckIn._id.toString(),
    );

    const parent = testEvent.toObject();

    const averageFeedbackScorePayload = await averageFeedbackScoreResolver?.(
      parent,
      {},
      {},
    );

    expect(averageFeedbackScorePayload).toEqual(3);
  });
});
