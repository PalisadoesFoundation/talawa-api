import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
  Event,
  Interface_Event,
} from "../../../src/models";
import { MutationUpdateEventArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { updateEvent as updateEventResolver } from "../../../src/resolvers/Mutation/updateEvent";
import {
  EVENT_NOT_FOUND,
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND,
} from "../../../src/constants";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUser: Interface_User & Document<any, any, Interface_User>;
let testEvent: Interface_Event & Document<any, any, Interface_Event>;

beforeAll(async () => {
  await connect("TALAWA_TESING_DB");

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
    members: [testUser._id],
    visibleInSearch: true,
  });

  await User.updateOne(
    {
      _id: testUser._id,
    },
    {
      $set: {
        createdOrganizations: [testOrganization._id],
        joinedOrganizations: [testOrganization._id],
      },
    }
  );

  testEvent = await Event.create({
    creator: testUser._id,
    registrants: [{ userId: testUser._id, user: testUser._id }],
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
        createdEvents: [testEvent._id],
        registeredEvents: [testEvent._id],
      },
    }
  );
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> updateEvent", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationUpdateEventArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await updateEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no event exists with _id === args.id`, async () => {
    try {
      const args: MutationUpdateEventArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser._id,
      };

      await updateEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(EVENT_NOT_FOUND);
    }
  });

  it(`throws UnauthorizedError if current user with _id === context.userId is
  not an admin of event with _id === args.id`, async () => {
    try {
      const args: MutationUpdateEventArgs = {
        id: testEvent._id,
      };

      const context = {
        userId: testUser._id,
      };

      await updateEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`updates the event with _id === args.id and returns the updated event`, async () => {
    await Event.updateOne(
      {
        _id: testEvent._id,
      },
      {
        $push: {
          admins: testUser._id,
        },
      }
    );

    await User.updateOne(
      {
        _id: testUser._id,
      },
      {
        $push: {
          eventAdmin: testEvent._id,
        },
      }
    );

    const args: MutationUpdateEventArgs = {
      id: testEvent._id,
      data: {
        allDay: false,
        description: "newDescription",
        endDate: new Date().toUTCString(),
        endTime: new Date().toUTCString(),
        isPublic: false,
        isRegisterable: false,
        latitude: 1,
        longitude: 1,
        location: "newLocation",
        recurring: false,
        startDate: new Date().toUTCString(),
        startTime: new Date().toUTCString(),
        title: "newTitle",
        recurrance: "DAILY",
      },
    };

    const context = {
      userId: testUser._id,
    };

    const updateEventPayload = await updateEventResolver?.({}, args, context);

    const testUpdateEventPayload = await Event.findOne({
      _id: testEvent._id,
    }).lean();

    expect(updateEventPayload).toEqual(testUpdateEventPayload);
  });
});
