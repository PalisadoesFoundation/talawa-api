import "dotenv/config";
import { Document, Types } from "mongoose";
import { Event, Task, Interface_Task } from "../../../src/models";
import { MutationUpdateTaskArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { updateTask as updateTaskResolver } from "../../../src/resolvers/Mutation/updateTask";
import { USER_NOT_AUTHORIZED, USER_NOT_FOUND } from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { testUserType } from "../../helpers/userAndOrg";
import { createTestEventWithRegistrants } from "../../helpers/eventsWithRegistrants";

let testUser: testUserType;
let testTasks: (Interface_Task & Document<any, any, Interface_Task>)[];

beforeAll(async () => {
  await connect("TALAWA_TESTING_DB");
  const temp = await createTestEventWithRegistrants();
  testUser = temp[0];
  const testEvent = temp[2];

  testTasks = await Task.insertMany([
    {
      title: "title",
      event: testEvent!._id,
      creator: testUser!._id,
    },
    {
      title: "title",
      event: testEvent!._id,
      creator: Types.ObjectId().toString(),
    },
  ]);

  await Event.updateOne(
    {
      _id: testEvent!._id,
    },
    {
      $push: {
        tasks: [testTasks[0]._id, testTasks[1]._id],
      },
    }
  );
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> updateTask", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationUpdateTaskArgs = {
        id: "",
        data: {},
      };

      const context = { userId: Types.ObjectId().toString() };

      await updateTaskResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no task exists with _id === args.id`, async () => {
    try {
      const args: MutationUpdateTaskArgs = {
        id: Types.ObjectId().toString(),
        data: {},
      };

      const context = { userId: testUser!._id };

      await updateTaskResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual("Task not found");
    }
  });

  it(`throws NotAuthorizedError if post.creator !== context.userId post with _id === args.id, `, async () => {
    try {
      const args: MutationUpdateTaskArgs = {
        id: testTasks[1]._id,
        data: {},
      };

      const context = {
        userId: testUser!._id,
      };

      await updateTaskResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
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

    const context = { userId: testUser!._id };

    const updateTaskPayload = await updateTaskResolver?.({}, args, context);

    const updatedTestTask = await Task.findOne({
      _id: testTasks[0]._id,
    }).lean();

    expect(updateTaskPayload).toEqual(updatedTestTask);
  });
});
