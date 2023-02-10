import "dotenv/config";
import { tasksByEvent as tasksByEventResolver } from "../../../src/resolvers/Query/tasksByEvent";
import { connect, disconnect } from "../../../src/db";
import {
  User,
  Organization,
  Event,
  Task,
  Interface_Event,
} from "../../../src/models";
import { nanoid } from "nanoid";
import { Document } from "mongoose";
import { QueryTasksByEventArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testEvent: Interface_Event & Document<any, any, Interface_Event>;

beforeAll(async () => {
  await connect();

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
      $push: {
        createdOrganizations: testOrganization._id,
        adminFor: testOrganization._id,
        joinedOrganizations: testOrganization._id,
        createdEvents: testEvent._id,
        registeredEvents: testEvent._id,
        eventAdmin: testEvent._id,
      },
    }
  );

  const testTasks = await Task.insertMany([
    {
      title: `title${nanoid()}`,
      description: `description${nanoid()}`,
      event: testEvent._id,
      creator: testUser._id,
      deadline: new Date(),
    },
    {
      title: `title${nanoid()}`,
      description: `description${nanoid()}`,
      event: testEvent._id,
      creator: testUser._id,
      deadline: new Date(),
    },
  ]);

  await Event.updateOne(
    {
      _id: testEvent._id,
    },
    {
      $set: {
        tasks: [testTasks[0]._id, testTasks[1]._id],
      },
    }
  );
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Query -> tasksByEvent", () => {
  it("returns list of all tasks with task.creator === args.id", async () => {
    const args: QueryTasksByEventArgs = {
      id: testEvent.id,
      orderBy: null,
    };

    const tasksByEventPayload = await tasksByEventResolver?.({}, args, {});

    const tasksByEvent = await Task.find({
      event: testEvent._id,
    })
      .populate("event")
      .populate("creator", "-password")
      .lean();

    expect(tasksByEventPayload).toEqual(tasksByEvent);
  });

  it(`returns list of all tasks with task.creator === args.id and sorted by
  ascending order of task._id if args.orderBy === 'id_ASC'`, async () => {
    const sort = {
      _id: 1,
    };

    const args: QueryTasksByEventArgs = {
      id: testEvent.id,
      orderBy: "id_ASC",
    };

    const tasksByEventPayload = await tasksByEventResolver?.({}, args, {});

    const tasksByEvent = await Task.find({
      event: testEvent._id,
    })
      .sort(sort)
      .populate("event")
      .populate("creator", "-password")
      .lean();

    expect(tasksByEventPayload).toEqual(tasksByEvent);
  });

  it(`returns list of all tasks with task.creator === args.id and sorted by
  descending order of task._id if args.orderBy === 'id_DESC'`, async () => {
    const sort = {
      _id: -1,
    };

    const args: QueryTasksByEventArgs = {
      id: testEvent.id,
      orderBy: "id_DESC",
    };

    const tasksByEventPayload = await tasksByEventResolver?.({}, args, {});

    const tasksByEvent = await Task.find({
      event: testEvent._id,
    })
      .sort(sort)
      .populate("event")
      .populate("creator", "-password")
      .lean();

    expect(tasksByEventPayload).toEqual(tasksByEvent);
  });

  it(`returns list of all tasks with task.creator === args.id and sorted by
  ascending order of task.title if args.orderBy === 'title_ASC'`, async () => {
    const sort = {
      title: 1,
    };

    const args: QueryTasksByEventArgs = {
      id: testEvent.id,
      orderBy: "title_ASC",
    };

    const tasksByEventPayload = await tasksByEventResolver?.({}, args, {});

    const tasksByEvent = await Task.find({
      event: testEvent._id,
    })
      .sort(sort)
      .populate("event")
      .populate("creator", "-password")
      .lean();

    expect(tasksByEventPayload).toEqual(tasksByEvent);
  });

  it(`returns list of all tasks with task.creator === args.id and sorted by
  descending order of task.title if args.orderBy === 'title_DESC'`, async () => {
    const sort = {
      title: -1,
    };

    const args: QueryTasksByEventArgs = {
      id: testEvent.id,
      orderBy: "title_DESC",
    };

    const tasksByEventPayload = await tasksByEventResolver?.({}, args, {});

    const tasksByEvent = await Task.find({
      event: testEvent._id,
    })
      .sort(sort)
      .populate("event")
      .populate("creator", "-password")
      .lean();

    expect(tasksByEventPayload).toEqual(tasksByEvent);
  });

  it(`returns list of all tasks with task.creator === args.id and sorted by
  ascending order of task.description if args.orderBy === 'description_ASC'`, async () => {
    const sort = {
      description: 1,
    };

    const args: QueryTasksByEventArgs = {
      id: testEvent.id,
      orderBy: "description_ASC",
    };

    const tasksByEventPayload = await tasksByEventResolver?.({}, args, {});

    const tasksByEvent = await Task.find({
      event: testEvent._id,
    })
      .sort(sort)
      .populate("event")
      .populate("creator", "-password")
      .lean();

    expect(tasksByEventPayload).toEqual(tasksByEvent);
  });

  it(`returns list of all tasks with task.creator === args.id and sorted by
  descending order of task.description if args.orderBy === 'description_DESC'`, async () => {
    const sort = {
      description: -1,
    };

    const args: QueryTasksByEventArgs = {
      id: testEvent.id,
      orderBy: "description_DESC",
    };

    const tasksByEventPayload = await tasksByEventResolver?.({}, args, {});

    const tasksByEvent = await Task.find({
      event: testEvent._id,
    })
      .sort(sort)
      .populate("event")
      .populate("creator", "-password")
      .lean();

    expect(tasksByEventPayload).toEqual(tasksByEvent);
  });

  it(`returns list of all tasks with task.creator === args.id and sorted by
  ascending order of task.createdAt if args.orderBy === 'createdAt_ASC'`, async () => {
    const sort = {
      createdAt: 1,
    };

    const args: QueryTasksByEventArgs = {
      id: testEvent.id,
      orderBy: "createdAt_ASC",
    };

    const tasksByEventPayload = await tasksByEventResolver?.({}, args, {});

    const tasksByEvent = await Task.find({
      event: testEvent._id,
    })
      .sort(sort)
      .populate("event")
      .populate("creator", "-password")
      .lean();

    expect(tasksByEventPayload).toEqual(tasksByEvent);
  });

  it(`returns list of all tasks with task.creator === args.id and sorted by
  descending order of task.createdAt if args.orderBy === 'createdAt_DESC'`, async () => {
    const sort = {
      createdAt: -1,
    };

    const args: QueryTasksByEventArgs = {
      id: testEvent.id,
      orderBy: "createdAt_DESC",
    };

    const tasksByEventPayload = await tasksByEventResolver?.({}, args, {});

    const tasksByEvent = await Task.find({
      event: testEvent._id,
    })
      .sort(sort)
      .populate("event")
      .populate("creator", "-password")
      .lean();

    expect(tasksByEventPayload).toEqual(tasksByEvent);
  });

  it(`returns list of all tasks with task.creator === args.id and sorted by
  ascending order of task.deadline if args.orderBy === 'deadline_ASC'`, async () => {
    const sort = {
      deadline: 1,
    };

    const args: QueryTasksByEventArgs = {
      id: testEvent.id,
      orderBy: "deadline_ASC",
    };

    const tasksByEventPayload = await tasksByEventResolver?.({}, args, {});

    const tasksByEvent = await Task.find({
      event: testEvent._id,
    })
      .sort(sort)
      .populate("event")
      .populate("creator", "-password")
      .lean();

    expect(tasksByEventPayload).toEqual(tasksByEvent);
  });

  it(`returns list of all tasks with task.creator === args.id and sorted by
  descending order of task.deadline if args.orderBy === 'deadline_DESC'`, async () => {
    const sort = {
      deadline: -1,
    };

    const args: QueryTasksByEventArgs = {
      id: testEvent.id,
      orderBy: "deadline_DESC",
    };

    const tasksByEventPayload = await tasksByEventResolver?.({}, args, {});

    const tasksByEvent = await Task.find({
      event: testEvent._id,
    })
      .sort(sort)
      .populate("event")
      .populate("creator", "-password")
      .lean();

    expect(tasksByEventPayload).toEqual(tasksByEvent);
  });
});
