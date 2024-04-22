import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { EVENT_NOT_FOUND_ERROR } from "../../../src/constants";
import { Event } from "../../../src/models";
import { event as eventResolver } from "../../../src/resolvers/Query/event";
import { connect, disconnect } from "../../helpers/db";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { QueryEventArgs } from "../../../src/types/generatedGraphQLTypes";
import type { TestEventType } from "../../helpers/events";
import { createTestEvent } from "../../helpers/events";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
// let testUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestEvent();
  // testUser = resultArray[0];
  testEvent = resultArray[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> event", () => {
  it(`throws NotFoundError if no event exists with _id === args.id`, async () => {
    try {
      const args: QueryEventArgs = {
        id: new Types.ObjectId().toString(),
      };

      await eventResolver?.({}, args, {});
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(EVENT_NOT_FOUND_ERROR.DESC);
    }
  });

  it(`returns event object with populated fields creator and admins`, async () => {
    const args: QueryEventArgs = {
      id: testEvent?._id.toString() ?? "",
    };

    const eventPayload = await eventResolver?.({}, args, {});

    const event = await Event.findOne({
      _id: testEvent?._id,
    })
      .populate("creatorId", "-password")
      .populate("admins", "-password")
      .lean();
    console.log(event, eventPayload);
    expect(eventPayload).toEqual(event);
  });
});
