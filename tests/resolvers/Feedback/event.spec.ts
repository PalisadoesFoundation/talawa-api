import "dotenv/config";
import { event as eventResolver } from "../../../src/resolvers/Feedback/event";
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

describe("resolvers -> Feedback -> event", () => {
  it(`returns the correct event object for parent feedback`, async () => {
    const parent = testFeedback?.toObject();
    if (!parent) {
      throw new Error("Parent object is undefined.");
    }

    const eventPayload = await eventResolver?.(parent, {}, {});

    expect(eventPayload).toEqual(testEvent?.toObject());
  });
});
