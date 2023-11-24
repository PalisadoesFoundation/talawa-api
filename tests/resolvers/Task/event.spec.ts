import "dotenv/config";
import { event as eventResolver } from "../../../src/resolvers/Task/event";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createAndAssignTestTask, type TestTaskType } from "../../helpers/task";
import { Event } from "../../../src/models";
import type { TestEventType } from "../../helpers/events";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let testTask: TestTaskType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, , testEvent, , testTask] = await createAndAssignTestTask();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Task -> event", () => {
  it(`returns the correct event object for parent task`, async () => {
    const parent = testTask!.toObject();

    const eventPayload = await eventResolver?.(parent, {}, {});

    const eventObject = await Event.findOne({
      _id: testEvent!._id,
    }).lean();

    expect(eventPayload).toEqual(eventObject);
  });
});
