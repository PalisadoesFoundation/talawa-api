import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
  Event,
  Interface_Event,
} from "../../../src/models";
import { MutationCreateTaskArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { createTask as createTaskResolver } from "../../../src/resolvers/Mutation/createTask";
import { EVENT_NOT_FOUND, USER_NOT_FOUND } from "../../../src/constants";
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
    admins: [testUser._id],
    members: [testUser._id],
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
      },
    }
  );

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
        createdEvents: [testEvent._id],
        registeredEvents: [testEvent._id],
        eventAdmin: [testEvent._id],
      },
    }
  );
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> createTask", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationCreateTaskArgs = {
        eventId: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await createTaskResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no event exists with _id === args.eventId`, async () => {
    try {
      const args: MutationCreateTaskArgs = {
        eventId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser.id,
      };

      await createTaskResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(EVENT_NOT_FOUND);
    }
  });

  it(`creates the task and returns it`, async () => {
    const args: MutationCreateTaskArgs = {
      eventId: testEvent.id,
      data: {
        title: "title",
        deadline: new Date().toString(),
        description: "description",
      },
    };

    const context = {
      userId: testUser._id,
    };

    const createTaskPayload = await createTaskResolver?.({}, args, context);

    expect(createTaskPayload).toEqual(
      expect.objectContaining({
        title: "title",
        description: "description",
      })
    );
    expect(createTaskPayload?.deadline).toBeInstanceOf(Date);

    const testUpdatedEvent = await Event.findOne({
      _id: testEvent._id,
    })
      .select(["tasks"])
      .lean();

    expect(testUpdatedEvent!.tasks).toEqual([createTaskPayload?._id]);
  });
});
