import "dotenv/config";
import { feedback as feedbackResolver } from "../../../src/resolvers/Event/feedback";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestEventType } from "../../helpers/events";
import { type TestFeedbackType, createFeedback } from "../../helpers/feedback";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let testFeedback: TestFeedbackType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, , testEvent, , testFeedback] = await createFeedback();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Event -> feedback", () => {
  it(`returns all the feedback objects for parent event`, async () => {
    const parent = testEvent?.toObject();
    if (!parent) {
      throw new Error("Parent object is undefined.");
    }

    const feedbackPayload = await feedbackResolver?.(parent, {}, {});

    expect(feedbackPayload?.length).toEqual(1);
    expect(feedbackPayload?.[0]).toEqual(testFeedback?.toObject());
  });
});
