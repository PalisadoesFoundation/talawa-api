import "dotenv/config";
import { isUserRegister as isUserRegisterResolver } from "../../../src/resolvers/Query/isUserRegister";
import { connect, disconnect } from "../../helpers/db";
import { Event } from "../../../src/models";
import mongoose, { Types } from "mongoose";
import { QueryIsUserRegisterArgs } from "../../../src/types/generatedGraphQLTypes";
import { EVENT_NOT_FOUND_ERROR } from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  TestUserType,
  TestOrganizationType,
  createTestUserAndOrganization,
} from "../../helpers/userAndOrg";
import { TestEventType, createEventWithRegistrant } from "../../helpers/events";
import { createTestTask } from "../../helpers/task";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let testUser: TestUserType;
let testOrganization: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, testOrganization] = await createTestUserAndOrganization();
  testEvent = await createEventWithRegistrant(
    testUser?._id,
    testOrganization?._id,
    true,
    "ONCE"
  );

  await createTestTask(testEvent?._id, testUser?._id);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> isUserRegister", () => {
  it(`throws NotFoundError if no event exists with _id === args.eventId
   and event.status === 'ACTIVE'`, async () => {
    try {
      const args: QueryIsUserRegisterArgs = {
        eventId: Types.ObjectId().toString(),
      };

      const context = {};

      await isUserRegisterResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(EVENT_NOT_FOUND_ERROR.DESC);
    }
  });

  it(`returns object with event object and isRegistered === false
  if user with _id === context.userId is not a registrant to the event and
  user's registrant status === 'ACTIVE'`, async () => {
    const args: QueryIsUserRegisterArgs = {
      eventId: testEvent?.id,
    };

    const context = {
      userId: Types.ObjectId().toString(),
    };

    const event = await Event.findOne({
      _id: testEvent?._id,
      status: "ACTIVE",
    })
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    const isUserRegisterPayload = await isUserRegisterResolver?.(
      {},
      args,
      context
    );

    expect(isUserRegisterPayload).toEqual({
      event,
      isRegistered: false,
    });
  });

  it(`returns object with event object and isRegistered === false
  if user with _id === context.userId is a registrant to the event and
  user's registrant status !== 'ACTIVE'`, async () => {
    const args: QueryIsUserRegisterArgs = {
      eventId: testEvent?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    const event = await Event.findOneAndUpdate(
      {
        _id: testEvent?._id,
        "registrants.userId": testUser?._id,
      },
      {
        $set: {
          "registrants.$.status": "BLOCKED",
        },
      },
      {
        new: true,
      }
    )
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    const isUserRegisterPayload = await isUserRegisterResolver?.(
      {},
      args,
      context
    );

    expect(isUserRegisterPayload).toEqual({
      event,
      isRegistered: false,
    });
  });

  it(`returns object with event object and isRegistered === true
  if user with _id === context.userId is a registrant to the event and
  user's registrant status === 'ACTIVE'`, async () => {
    const args: QueryIsUserRegisterArgs = {
      eventId: testEvent?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    const event = await Event.findOneAndUpdate(
      {
        _id: testEvent?._id,
        "registrants.userId": testUser?._id,
      },
      {
        $set: {
          "registrants.$.status": "ACTIVE",
        },
      },
      {
        new: true,
      }
    )
      .populate("creator", "-password")
      .populate("tasks")
      .populate("admins", "-password")
      .lean();

    const isUserRegisterPayload = await isUserRegisterResolver?.(
      {},
      args,
      context
    );

    expect(isUserRegisterPayload).toEqual({
      event,
      isRegistered: true,
    });
  });
});
