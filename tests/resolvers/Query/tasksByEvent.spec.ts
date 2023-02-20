import "dotenv/config";
import { tasksByEvent as tasksByEventResolver } from "../../../src/resolvers/Query/tasksByEvent";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { Task } from "../../../src/models";
import { QueryTasksByEventArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import { createEventWithRegistrant, testEventType } from "../../helpers/events";
import { createTestTask } from "../../helpers/task";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testEvent: testEventType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const [testUser, testOrganization] = await createTestUserAndOrganization();
  testEvent = await createEventWithRegistrant(
    testUser?._id,
    testOrganization?._id,
    true,
    "ONCE"
  );

  await createTestTask(testEvent?._id, testUser?._id);
  await createTestTask(testEvent?._id, testUser?._id);
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Query -> tasksByEvent", () => {
  it("returns list of all tasks with task.creator === args.id", async () => {
    const args: QueryTasksByEventArgs = {
      id: testEvent?.id,
      orderBy: null,
    };

    const tasksByEventPayload = await tasksByEventResolver?.({}, args, {});

    const tasksByEvent = await Task.find({
      event: testEvent?._id,
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
      id: testEvent?.id,
      orderBy: "id_ASC",
    };

    const tasksByEventPayload = await tasksByEventResolver?.({}, args, {});

    const tasksByEvent = await Task.find({
      event: testEvent?._id,
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
      id: testEvent?.id,
      orderBy: "id_DESC",
    };

    const tasksByEventPayload = await tasksByEventResolver?.({}, args, {});

    const tasksByEvent = await Task.find({
      event: testEvent?._id,
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
      id: testEvent?.id,
      orderBy: "title_ASC",
    };

    const tasksByEventPayload = await tasksByEventResolver?.({}, args, {});

    const tasksByEvent = await Task.find({
      event: testEvent?._id,
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
      id: testEvent?.id,
      orderBy: "title_DESC",
    };

    const tasksByEventPayload = await tasksByEventResolver?.({}, args, {});

    const tasksByEvent = await Task.find({
      event: testEvent?._id,
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
      id: testEvent?.id,
      orderBy: "description_ASC",
    };

    const tasksByEventPayload = await tasksByEventResolver?.({}, args, {});

    const tasksByEvent = await Task.find({
      event: testEvent?._id,
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
      id: testEvent?.id,
      orderBy: "description_DESC",
    };

    const tasksByEventPayload = await tasksByEventResolver?.({}, args, {});

    const tasksByEvent = await Task.find({
      event: testEvent?._id,
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
      id: testEvent?.id,
      orderBy: "createdAt_ASC",
    };

    const tasksByEventPayload = await tasksByEventResolver?.({}, args, {});

    const tasksByEvent = await Task.find({
      event: testEvent?._id,
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
      id: testEvent?.id,
      orderBy: "createdAt_DESC",
    };

    const tasksByEventPayload = await tasksByEventResolver?.({}, args, {});

    const tasksByEvent = await Task.find({
      event: testEvent?._id,
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
      id: testEvent?.id,
      orderBy: "deadline_ASC",
    };

    const tasksByEventPayload = await tasksByEventResolver?.({}, args, {});

    const tasksByEvent = await Task.find({
      event: testEvent?._id,
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
      id: testEvent?.id,
      orderBy: "deadline_DESC",
    };

    const tasksByEventPayload = await tasksByEventResolver?.({}, args, {});

    const tasksByEvent = await Task.find({
      event: testEvent?._id,
    })
      .sort(sort)
      .populate("event")
      .populate("creator", "-password")
      .lean();

    expect(tasksByEventPayload).toEqual(tasksByEvent);
  });

  it(`returns list of all tasks with task.creator === args.id and sorted by
  descending order of task.deadline if args.orderBy === undefined`, async () => {
    const sort = {
      deadline: -1,
    };

    const args: QueryTasksByEventArgs = {
      id: testEvent?.id,
      orderBy: undefined,
    };

    const tasksByEventPayload = await tasksByEventResolver?.({}, args, {});

    const tasksByEvent = await Task.find({
      event: testEvent?._id,
    })
      .sort(sort)
      .populate("event")
      .populate("creator", "-password")
      .lean();

    expect(tasksByEventPayload).toEqual(tasksByEvent);
  });
});
