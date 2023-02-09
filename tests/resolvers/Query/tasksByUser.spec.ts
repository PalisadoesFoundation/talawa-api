import "dotenv/config";
import { tasksByUser as tasksByUserResolver } from "../../../src/resolvers/Query/tasksByUser";
import { connect, disconnect } from "../../../src/db";
import {
  User,
  Organization,
  Event,
  Task,
  Interface_User,
} from "../../../src/models";
import { QueryTasksByUserArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { testUserType, testOrganizationType, createTestUserAndOrganization } from "../../helpers/userAndOrg";
import { createEventWithRegistrant} from "../../helpers/events";
import { createTestTask } from "../../helpers/task";

let testUser: testUserType;
let testOrganization:testOrganizationType; 
beforeAll(async () => {
  await connect();
  const [testUser, testOrganization] = await createTestUserAndOrganization();
  const testEvent = await createEventWithRegistrant(testUser._id, testOrganization._id,true,"ONCE");
  const testTasks = [
    await createTestTask(testEvent._id, testUser._id),
    await createTestTask(testEvent._id, testUser._id)
  ];
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Query -> tasksByUser", () => {
  it(`returns list of all tasks with task.creator === args.id without sorting
  if args.orderBy === null`, async () => {
    const args: QueryTasksByUserArgs = {
      id: testUser._id,
      orderBy: null,
    };

    const tasksByUserPayload = await tasksByUserResolver?.({}, args, {});

    const tasksByUser = await Task.find({
      creator: testUser._id,
    })
      .populate("event")
      .populate("creator", "-password")
      .lean();

    expect(tasksByUserPayload).toEqual(tasksByUser);
  });

  it(`returns list of all tasks with task.creator === args.id and sorted by
  ascending order of task._id if args.orderBy === 'id_ASC'`, async () => {
    const sort = {
      _id: 1,
    };

    const args: QueryTasksByUserArgs = {
      id: testUser._id,
      orderBy: "id_ASC",
    };

    const tasksByUserPayload = await tasksByUserResolver?.({}, args, {});

    const tasksByUser = await Task.find({
      creator: testUser._id,
    })
      .sort(sort)
      .populate("event")
      .populate("creator", "-password")
      .lean();

    expect(tasksByUserPayload).toEqual(tasksByUser);
  });

  it(`returns list of all tasks with task.creator === args.id and sorted by
  descending order of task._id if args.orderBy === 'id_DESC'`, async () => {
    const sort = {
      _id: -1,
    };

    const args: QueryTasksByUserArgs = {
      id: testUser._id,
      orderBy: "id_DESC",
    };

    const tasksByUserPayload = await tasksByUserResolver?.({}, args, {});

    const tasksByUser = await Task.find({
      creator: testUser._id,
    })
      .sort(sort)
      .populate("event")
      .populate("creator", "-password")
      .lean();

    expect(tasksByUserPayload).toEqual(tasksByUser);
  });

  it(`returns list of all tasks with task.creator === args.id and sorted by
  ascending order of task.title if args.orderBy === 'title_ASC'`, async () => {
    const sort = {
      title: 1,
    };

    const args: QueryTasksByUserArgs = {
      id: testUser._id,
      orderBy: "title_ASC",
    };

    const tasksByUserPayload = await tasksByUserResolver?.({}, args, {});

    const tasksByUser = await Task.find({
      creator: testUser._id,
    })
      .sort(sort)
      .populate("event")
      .populate("creator", "-password")
      .lean();

    expect(tasksByUserPayload).toEqual(tasksByUser);
  });

  it(`returns list of all tasks with task.creator === args.id and sorted by
  descending order of task.title if args.orderBy === 'title_DESC'`, async () => {
    const sort = {
      title: -1,
    };

    const args: QueryTasksByUserArgs = {
      id: testUser._id,
      orderBy: "title_DESC",
    };

    const tasksByUserPayload = await tasksByUserResolver?.({}, args, {});

    const tasksByUser = await Task.find({
      creator: testUser._id,
    })
      .sort(sort)
      .populate("event")
      .populate("creator", "-password")
      .lean();

    expect(tasksByUserPayload).toEqual(tasksByUser);
  });

  it(`returns list of all tasks with task.creator === args.id and sorted by
  ascending order of task.description if args.orderBy === 'description_ASC'`, async () => {
    const sort = {
      description: 1,
    };

    const args: QueryTasksByUserArgs = {
      id: testUser._id,
      orderBy: "description_ASC",
    };

    const tasksByUserPayload = await tasksByUserResolver?.({}, args, {});

    const tasksByUser = await Task.find({
      creator: testUser._id,
    })
      .sort(sort)
      .populate("event")
      .populate("creator", "-password")
      .lean();

    expect(tasksByUserPayload).toEqual(tasksByUser);
  });

  it(`returns list of all tasks with task.creator === args.id and sorted by
  descending order of task.description if args.orderBy === 'description_DESC'`, async () => {
    const sort = {
      description: -1,
    };

    const args: QueryTasksByUserArgs = {
      id: testUser._id,
      orderBy: "description_DESC",
    };

    const tasksByUserPayload = await tasksByUserResolver?.({}, args, {});

    const tasksByUser = await Task.find({
      creator: testUser._id,
    })
      .sort(sort)
      .populate("event")
      .populate("creator", "-password")
      .lean();

    expect(tasksByUserPayload).toEqual(tasksByUser);
  });

  it(`returns list of all tasks with task.creator === args.id and sorted by
  ascending order of task.createdAt if args.orderBy === 'createdAt_ASC'`, async () => {
    const sort = {
      createdAt: 1,
    };

    const args: QueryTasksByUserArgs = {
      id: testUser._id,
      orderBy: "createdAt_ASC",
    };

    const tasksByUserPayload = await tasksByUserResolver?.({}, args, {});

    const tasksByUser = await Task.find({
      creator: testUser._id,
    })
      .sort(sort)
      .populate("event")
      .populate("creator", "-password")
      .lean();

    expect(tasksByUserPayload).toEqual(tasksByUser);
  });

  it(`returns list of all tasks with task.creator === args.id and sorted by
  descending order of task.createdAt if args.orderBy === 'createdAt_DESC'`, async () => {
    const sort = {
      createdAt: -1,
    };

    const args: QueryTasksByUserArgs = {
      id: testUser._id,
      orderBy: "createdAt_DESC",
    };

    const tasksByUserPayload = await tasksByUserResolver?.({}, args, {});

    const tasksByUser = await Task.find({
      creator: testUser._id,
    })
      .sort(sort)
      .populate("event")
      .populate("creator", "-password")
      .lean();

    expect(tasksByUserPayload).toEqual(tasksByUser);
  });

  it(`returns list of all tasks with task.creator === args.id and sorted by
  ascending order of task.deadline if args.orderBy === 'deadline_ASC'`, async () => {
    const sort = {
      deadline: 1,
    };

    const args: QueryTasksByUserArgs = {
      id: testUser._id,
      orderBy: "deadline_ASC",
    };

    const tasksByUserPayload = await tasksByUserResolver?.({}, args, {});

    const tasksByUser = await Task.find({
      creator: testUser._id,
    })
      .sort(sort)
      .populate("event")
      .populate("creator", "-password")
      .lean();

    expect(tasksByUserPayload).toEqual(tasksByUser);
  });

  it(`returns list of all tasks with task.creator === args.id and sorted by
  descending order of task.deadline if args.orderBy === 'deadline_DESC'`, async () => {
    const sort = {
      deadline: -1,
    };

    const args: QueryTasksByUserArgs = {
      id: testUser._id,
      orderBy: "deadline_DESC",
    };

    const tasksByUserPayload = await tasksByUserResolver?.({}, args, {});

    const tasksByUser = await Task.find({
      creator: testUser._id,
    })
      .sort(sort)
      .populate("event")
      .populate("creator", "-password")
      .lean();

    expect(tasksByUserPayload).toEqual(tasksByUser);
  });

  it(`returns list of all tasks with task.creator === args.id and sorted by
  descending order of task.deadline if args.orderBy === undefined`, async () => {
    const sort = {
      deadline: -1,
    };

    const args: QueryTasksByUserArgs = {
      id: testUser._id,
      orderBy: undefined,
    };

    const tasksByUserPayload = await tasksByUserResolver?.({}, args, {});

    const tasksByUser = await Task.find({
      creator: testUser._id,
    })
      .sort(sort)
      .populate("event")
      .populate("creator", "-password")
      .lean();

    expect(tasksByUserPayload).toEqual(tasksByUser);
  });
});
