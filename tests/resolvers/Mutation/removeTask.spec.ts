import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
  Event,
  Task,
  Interface_Task,
} from "../../../src/models";
import { MutationRemoveTaskArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { removeTask as removeTaskResolver } from "../../../src/resolvers/Mutation/removeTask";
import { USER_NOT_AUTHORIZED, USER_NOT_FOUND } from "../../../src/constants";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUsers: (Interface_User & Document<any, any, Interface_User>)[];
let testTask: Interface_Task & Document<any, any, Interface_Task>;

beforeAll(async () => {
  await connect("TALAWA_TESTING_DB");

  testUsers = await User.insertMany([
    {
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: "password",
      firstName: "firstName",
      lastName: "lastName",
      appLanguageCode: "en",
    },
    {
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: "password",
      firstName: "firstName",
      lastName: "lastName",
      appLanguageCode: "en",
    },
  ]);

  const testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUsers[0]._id,
    admins: [testUsers[0]._id],
    members: [testUsers[0]._id],
  });

  await User.updateOne(
    {
      _id: testUsers[0]._id,
    },
    {
      $set: {
        createdOrganizations: [testOrganization._id],
        adminFor: [testOrganization._id],
        joinedOrganizations: [testOrganization._id],
      },
    }
  );

  const testEvent = await Event.create({
    creator: testUsers[0]._id,
    registrants: [
      {
        userId: testUsers[0]._id,
        user: testUsers[0]._id,
      },
    ],
    admins: [testUsers[0]._id],
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
      _id: testUsers[0]._id,
    },
    {
      $set: {
        createdEvents: [testEvent._id],
        registeredEvents: [testEvent._id],
        eventAdmin: [testEvent._id],
      },
    }
  );

  testTask = await Task.create({
    title: "title",
    event: testEvent._id,
    creator: testUsers[0]._id,
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

describe("resolvers -> Mutation -> removeTask", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationRemoveTaskArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await removeTaskResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no task exists with _id === args.id`, async () => {
    try {
      const args: MutationRemoveTaskArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUsers[0]._id,
      };

      await removeTaskResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual("Task not found");
    }
  });

  it(`throws NotAuthorizedError if for creator of task with _id === args.id, user._id !== context.userId`, async () => {
    try {
      const args: MutationRemoveTaskArgs = {
        id: testTask._id,
      };

      const context = {
        userId: testUsers[1]._id,
      };

      await removeTaskResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`removes the task with _id === args.id and returns it`, async () => {
    const args: MutationRemoveTaskArgs = {
      id: testTask._id,
    };

    const context = {
      userId: testUsers[0]._id,
    };

    const removeTaskPayload = await removeTaskResolver?.({}, args, context);

    expect(removeTaskPayload).toEqual(testTask.toObject());

    const testRemovedTask = await Task.findOne({
      _id: testTask._id,
    }).lean();

    expect(testRemovedTask).toEqual(null);

    const testUpdatedEvents = await Event.find({
      _id: testTask.event,
    }).lean();

    testUpdatedEvents.forEach((testUpdatedEvent) => {
      testUpdatedEvent.tasks.forEach((task) => {
        expect(task.toString()).not.toEqual(testTask._id.toString());
      });
    });
  });
});
