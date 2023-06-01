import "dotenv/config";
import { assignedTasks as assignedTasksResolver } from "../../../src/resolvers/User/assignedTasks";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { Task } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createAndAssignTestTask, type TestTaskType } from "../../helpers/task";

let testUser: TestUserType;
let testTask: TestTaskType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , , , testTask] = await createAndAssignTestTask();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> User -> assignedTasks", () => {
  it(`returns the assigned task objects for parent user`, async () => {
    const parent = testUser!.toObject();

    const assignedTasksPayload = await assignedTasksResolver?.(parent, {}, {});

    const assignedTasks = await Task.find({
      _id: testTask!._id,
    }).lean();

    expect(assignedTasksPayload).toEqual(assignedTasks);
  });
});
