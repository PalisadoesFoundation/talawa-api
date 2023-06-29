import "dotenv/config";
import { tasks as tasksResolver } from "../../../src/resolvers/EventProject/tasks";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createAndAssignTestTask,
  type TestEventProjectType,
  type TestTaskType,
} from "../../helpers/task";
import { Task } from "../../../src/models";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEventProject: TestEventProjectType;
let testTask: TestTaskType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [, , , testEventProject, testTask] = await createAndAssignTestTask();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> EventProject -> Tasks", () => {
  it(`returns the tasks objects for parent event project`, async () => {
    const parent = testEventProject!.toObject();

    const payload = await tasksResolver?.(parent, {}, {});

    const taskObject = await Task.find({
      _id: testTask!._id,
    }).lean();

    expect(payload!.length).toEqual(1);
    expect(payload).toMatchObject(taskObject);
  });
});
