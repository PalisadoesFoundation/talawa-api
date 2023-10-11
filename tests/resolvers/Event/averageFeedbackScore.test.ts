import "dotenv/config";
import { averageFeedbackScore as averageFeedbackScoreResolver } from "../../../src/resolvers/Event/averageFeedbackScore";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestEventType } from "../../helpers/events";
import { createFeedbackWithIDs } from "../../helpers/feedback";
import {
  type TestCheckInType,
  createEventWithCheckedInUser,
} from "../../helpers/checkIn";

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
    const parent = testEvent!.toObject();

    const averageFeedbackScorePayload = await averageFeedbackScoreResolver?.(
      parent,
      {},
      {}
    );

    expect(averageFeedbackScorePayload).toEqual(0);
  });

  it(`Should return the proper average score if there are some submitted feedbacks for the event`, async () => {
    await createFeedbackWithIDs(testEvent!._id, testCheckIn!._id);

    const parent = testEvent!.toObject();

    const averageFeedbackScorePayload = await averageFeedbackScoreResolver?.(
      parent,
      {},
      {}
    );

    expect(averageFeedbackScorePayload).toEqual(7);
  });
});
