import "dotenv/config";
import { Types } from "mongoose";
import { User, Event } from "../../../src/models";
import { MutationUpdateEventArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { updateEvent as updateEventResolver } from "../../../src/resolvers/Mutation/updateEvent";
import {
  EVENT_NOT_FOUND,
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestUserAndOrganization,
  testUserType,
} from "../../helpers/userAndOrg";
import { testEventType } from "../../helpers/events";

let testUser: testUserType;
let testEvent: testEventType;

beforeAll(async () => {
  await connect();
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
  const testOrganization = temp[1];
  testEvent = await Event.create({
    creator: testUser!._id,
    registrants: [{ userId: testUser!._id, user: testUser!._id }],
    organization: testOrganization!._id,
    isRegisterable: true,
    isPublic: true,
    title: "title",
    description: "description",
    allDay: true,
    startDate: new Date().toString(),
  });

  await User.updateOne(
    {
      _id: testUser!._id,
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
        userId: testUser!._id,
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
        id: testEvent!._id,
      };

      const context = {
        userId: testUser!._id,
      };

      await updateEventResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`updates the event with _id === args.id and returns the updated event`, async () => {
    await Event.updateOne(
      {
        _id: testEvent!._id,
      },
      {
        $push: {
          admins: testUser!._id,
        },
      }
    );

    await User.updateOne(
      {
        _id: testUser!._id,
      },
      {
        $push: {
          eventAdmin: testEvent!._id,
        },
      }
    );

    const args: MutationUpdateEventArgs = {
      id: testEvent!._id,
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
      userId: testUser!._id,
    };

    const updateEventPayload = await updateEventResolver?.({}, args, context);

    const testUpdateEventPayload = await Event.findOne({
      _id: testEvent!._id,
    }).lean();

    expect(updateEventPayload).toEqual(testUpdateEventPayload);
  });
});
