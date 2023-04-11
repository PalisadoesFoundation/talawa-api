import "dotenv/config";
import { event as eventResolver } from "../../../src/resolvers/Query/event";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { EVENT_NOT_FOUND_ERROR } from "../../../src/constants";
import { Event } from "../../../src/models";
import { Types } from "mongoose";
import { QueryEventArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { TestUserType } from "../../helpers/userAndOrg";
import { createTestEvent, TestEventType } from "../../helpers/events";
import { createTestTask } from "../../helpers/task";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let testUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestEvent();
  testUser = resultArray[0];
  testEvent = resultArray[2];
  createTestTask(testEvent?._id, testUser?._id);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> event", () => {
  it(`throws NotFoundError if no event exists with _id === args.id
   and event.status === 'ACTIVE'`, async () => {
    try {
      const args: QueryEventArgs = {
        id: Types.ObjectId().toString(),
      };

      await eventResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(EVENT_NOT_FOUND_ERROR.DESC);
    }
  });

  it(`returns event object with populated fields creator, tasks, admins`, async () => {
    const args: QueryEventArgs = {
      id: testEvent?._id,
    };

    const eventPayload = await eventResolver?.({}, args, {});

    const event = await Event.findOne({
      _id: testEvent?._id,
    })
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventPayload).toEqual(event);
  });
});
