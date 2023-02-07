import "dotenv/config";
import { event as eventResolver } from "../../../src/resolvers/Query/event";
import { connect, disconnect } from "../../../src/db";
import { EVENT_NOT_FOUND } from "../../../src/constants";
import {
  Event,
  Interface_Event,
  Interface_Organization,
  Interface_User
} from "../../../src/models";
import { Types } from "mongoose";
import { QueryEventArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { testUserType, testOrganizationType} from "../../helpers/userAndOrg";
import { createTestEvent, testEventType} from "../../helpers/events";
import { createTestTask } from "../../helpers/task";


let testEvent: testEventType;
let testUser: testUserType;
let testOrganization: testOrganizationType;

beforeAll(async () => {
  await connect();
  [testUser, testOrganization, testEvent] = await createTestEvent();
  const testTask = createTestTask(testEvent._id, testUser._id)
});

afterAll(async () => {
  await disconnect();
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
      expect(error.message).toEqual(EVENT_NOT_FOUND);
    }
  });

  it(`returns event object with populated fields creator, tasks, admins`, async () => {
    const args: QueryEventArgs = {
      id: testEvent?._id,
    };

    const eventPayload = await eventResolver?.({}, args, {});

    const event = await Event.findOne({
      _id: testEvent._id,
    })
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    expect(eventPayload).toEqual(event);
  });
});
