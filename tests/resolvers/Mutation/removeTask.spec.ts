import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { Task, TransactionLog } from "../../../src/models";
import type { MutationRemoveTaskArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { removeTask as removeTaskResolver } from "../../../src/resolvers/Mutation/removeTask";
import {
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  TASK_NOT_FOUND_ERROR,
  TRANSACTION_LOG_TYPES,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { createTestUser, type TestUserType } from "../../helpers/userAndOrg";
import { createAndAssignTestTask, type TestTaskType } from "../../helpers/task";
import { wait } from "./acceptAdmin.spec";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let randomTestUser: TestUserType;
let testTask: TestTaskType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  randomTestUser = await createTestUser();
  [testUser, , , , testTask] = await createAndAssignTestTask();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> removeTask", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationRemoveTaskArgs = {
        id: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      const { removeTask: removeTaskResolver } = await import(
        "../../../src/resolvers/Mutation/removeTask"
      );

      await removeTaskResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no task exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationRemoveTaskArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!._id,
      };

      const { removeTask: removeTaskResolver } = await import(
        "../../../src/resolvers/Mutation/removeTask"
      );

      await removeTaskResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(TASK_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(TASK_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotAuthorizedError if for creator of task with _id === args.id, user._id !== context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationRemoveTaskArgs = {
        id: testTask!._id,
      };

      const context = {
        userId: randomTestUser!._id,
      };

      const { removeTask: removeTaskResolver } = await import(
        "../../../src/resolvers/Mutation/removeTask"
      );

      await removeTaskResolver?.({}, args, context);
    } catch (error: any) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect(error.message).toEqual(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
  });

  it(`removes the task with _id === args.id and returns it`, async () => {
    const args: MutationRemoveTaskArgs = {
      id: testTask!._id,
    };

    const context = {
      userId: testUser!._id,
    };

    const removeTaskPayload = await removeTaskResolver?.({}, args, context);

    expect(removeTaskPayload).toEqual(testTask!.toObject());

    const testRemovedTask = await Task.findOne({
      _id: testTask!._id,
    }).lean();

    expect(testRemovedTask).toEqual(null);

    await wait();

    const mostRecentTransactions = await TransactionLog.find()
      .sort({
        createdAt: -1,
      })
      .limit(2);

    expect(mostRecentTransactions[0]).toMatchObject({
      createdBy: testUser?._id,
      type: TRANSACTION_LOG_TYPES.DELETE,
      modelName: "TaskVolunteer",
    });
    expect(mostRecentTransactions[1]).toMatchObject({
      createdBy: testUser?._id,
      type: TRANSACTION_LOG_TYPES.DELETE,
      modelName: "Task",
    });
  });
});
