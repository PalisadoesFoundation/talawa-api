import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { Task } from "../../../src/models";
import type { MutationUpdateTaskArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import { updateTask as updateTaskResolver } from "../../../src/resolvers/Mutation/updateTask";
import {
  TASK_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { createTestUser, type TestUserType } from "../../helpers/userAndOrg";
import { createAndAssignTestTask, type TestTaskType } from "../../helpers/task";

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

describe("resolvers -> Mutation -> updateTask", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId `, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateTaskArgs = {
        id: testUser?.id,
        data: {},
      };

      const context = { userId: Types.ObjectId().toString() };

      const { updateTask: updateTaskResolverNotFoundError } = await import(
        "../../../src/resolvers/Mutation/updateTask"
      );

      await updateTaskResolverNotFoundError?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
      );
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no task exists with _id === args.id `, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateTaskArgs = {
        id: Types.ObjectId().toString(),
        data: {},
      };

      const context = {
        userId: testUser?.id,
      };

      const { updateTask: updateTaskResolverNotFoundError } = await import(
        "../../../src/resolvers/Mutation/updateTask"
      );

      await updateTaskResolverNotFoundError?.({}, args, context);
    } catch (error: any) {
      expect(spy).toHaveBeenLastCalledWith(TASK_NOT_FOUND_ERROR.MESSAGE);
      expect(error.message).toEqual(
        `Translated ${TASK_NOT_FOUND_ERROR.MESSAGE}`
      );
    }
  });

  it(`throws NotAuthorizedError if task.creator !== context.userId task with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateTaskArgs = {
        id: testTask!._id,
        data: {},
      };

      const context = {
        userId: randomTestUser!._id,
      };

      const { updateTask: updateTaskResolverNotFoundError } = await import(
        "../../../src/resolvers/Mutation/updateTask"
      );

      await updateTaskResolverNotFoundError?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`
      );
      expect(spy).toHaveBeenLastCalledWith(
        `${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`
      );
    }
  });

  it(`updates the task with _id === args.id and returns it`, async () => {
    const args: MutationUpdateTaskArgs = {
      id: testTask!._id,
      data: {
        title: "newTitle",
        deadline: Date.now().toString(),
        description: "newDescription",
      },
    };

    const context = { userId: testUser?._id };

    const updateTaskPayload = await updateTaskResolver?.({}, args, context);

    const updatedTestTask = await Task.findOne({
      _id: testTask!._id,
    }).lean();

    expect(updateTaskPayload).toEqual(updatedTestTask);
  });
});
