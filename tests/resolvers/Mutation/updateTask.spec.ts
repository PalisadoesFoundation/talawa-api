import "dotenv/config";
import type { Document } from "mongoose";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { InterfaceTask } from "../../../src/models";
import { Event, Task } from "../../../src/models";
import type { MutationUpdateTaskArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { updateTask as updateTaskResolver } from "../../../src/resolvers/Mutation/updateTask";
import {
  TASK_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestEventWithRegistrants } from "../../helpers/eventsWithRegistrants";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testTasks: (InterfaceTask & Document<any, any, InterfaceTask>)[];

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestEventWithRegistrants();
  testUser = temp[0];
  const testEvent = temp[2];

  testTasks = await Task.insertMany([
    {
      title: "title",
      event: testEvent?._id,
      creator: testUser?._id,
    },
    {
      title: "title",
      event: testEvent?._id,
      creator: Types.ObjectId().toString(),
    },
  ]);

  await Event.updateOne(
    {
      _id: testEvent?._id,
    },
    {
      $push: {
        tasks: [testTasks[0]._id, testTasks[1]._id],
      },
    }
  );
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
        id: testTasks[1]._id,
        data: {},
      };

      const context = {
        userId: testUser?._id,
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
      id: testTasks[0]._id,
      data: {
        title: "newTitle",
        deadline: Date.now().toString(),
        description: "newDescription",
      },
    };

    const context = { userId: testUser?._id };

    const updateTaskPayload = await updateTaskResolver?.({}, args, context);

    const updatedTestTask = await Task.findOne({
      _id: testTasks[0]._id,
    }).lean();

    expect(updateTaskPayload).toEqual(updatedTestTask);
  });
});
