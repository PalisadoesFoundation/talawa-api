import "dotenv/config";
import { isUserRegister as isUserRegisterResolver } from "../../../src/resolvers/Query/isUserRegister";
import { Event } from "../../../src/models";
import { connect, disconnect } from "../../../src/db";
import { Types } from "mongoose";
import { QueryIsUserRegisterArgs } from "../../../src/types/generatedGraphQLTypes";
import { EVENT_NOT_FOUND } from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  testUserType,
  testOrganizationType,
  createTestUserAndOrganization,
} from "../../helpers/userAndOrg";
import { testEventType, createEventWithRegistrant } from "../../helpers/events";
import { createTestTask } from "../../helpers/task";

let testEvent: testEventType;
let testUser: testUserType;
let testOrganization: testOrganizationType;

beforeAll(async () => {
  await connect();
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
  await disconnect();
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
      expect(error.message).toEqual(EVENT_NOT_FOUND);
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
