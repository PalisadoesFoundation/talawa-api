import "dotenv/config";
import { isUserRegister as isUserRegisterResolver } from "../../../src/resolvers/Query/isUserRegister";
import {
  User,
  Organization,
  Event,
  Interface_Event,
  Task,
  Interface_User,
} from "../../../src/models";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
import { nanoid } from "nanoid";
import { Document, Types } from "mongoose";
import { QueryIsUserRegisterArgs } from "../../../src/types/generatedGraphQLTypes";
import { EVENT_NOT_FOUND } from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testUser: Interface_User & Document<any, any, Interface_User>;
let testEvent: Interface_Event & Document<any, any, Interface_Event>;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });

  const testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser._id,
    admins: [testUser._id],
    members: [testUser._id],
  });

  testEvent = await Event.create({
    creator: testUser._id,
    registrants: [
      {
        userId: testUser._id,
        user: testUser._id,
      },
    ],
    admins: [testUser._id],
    organization: testOrganization._id,
    isRegisterable: true,
    isPublic: true,
    title: "title",
    description: "description",
    allDay: true,
    startDate: new Date().toString(),
  });

  await User.updateOne(
    {
      _id: testUser._id,
    },
    {
      $set: {
        createdOrganizations: [testOrganization._id],
        adminFor: [testOrganization._id],
        joinedOrganizations: [testOrganization._id],
        createdEvents: [testEvent._id],
        registeredEvents: [testEvent._id],
        eventAdmin: [testEvent._id],
      },
    }
  );

  const testTask = await Task.create({
    title: "title",
    event: testEvent._id,
    creator: testUser._id,
  });

  await Event.updateOne(
    {
      _id: testEvent._id,
    },
    {
      $push: {
        tasks: testTask._id,
      },
    }
  );
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
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
      eventId: testEvent.id,
    };

    const context = {
      userId: Types.ObjectId().toString(),
    };

    const event = await Event.findOne({
      _id: testEvent._id,
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
      eventId: testEvent.id,
    };

    const context = {
      userId: testUser.id,
    };

    const event = await Event.findOneAndUpdate(
      {
        _id: testEvent._id,
        "registrants.userId": testUser._id,
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
      eventId: testEvent.id,
    };

    const context = {
      userId: testUser.id,
    };

    const event = await Event.findOneAndUpdate(
      {
        _id: testEvent._id,
        "registrants.userId": testUser._id,
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
