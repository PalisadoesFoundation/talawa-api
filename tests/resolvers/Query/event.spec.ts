import "dotenv/config";
import { event as eventResolver } from "../../../src/resolvers/Query/event";
import { connect, disconnect } from "../../../src/db";
import { EVENT_NOT_FOUND } from "../../../src/constants";
import {
  User,
  Organization,
  Event,
  Task,
  Interface_Event,
} from "../../../src/models";
import { nanoid } from "nanoid";
import { Document, Types } from "mongoose";
import { QueryEventArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testEvent: Interface_Event & Document<any, any, Interface_Event>;

beforeAll(async () => {
  await connect("TALAWA_TESING_DB");

  const testUser = await User.create({
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
    registrants: [{ userId: testUser._id, user: testUser._id }],
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
