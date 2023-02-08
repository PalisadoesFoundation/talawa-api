import "dotenv/config";
import { Document, Types } from "mongoose";
import { Event, Task, Interface_Task } from "../../../src/models";
import { MutationUpdateTaskArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { updateTask as updateTaskResolver } from "../../../src/resolvers/Mutation/updateTask";
import {
  USER_NOT_AUTHORIZED_MESSAGE,
  USER_NOT_FOUND_MESSAGE,
} from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  vi,
  afterEach,
} from "vitest";
import { testUserType } from "../../helpers/userAndOrg";
import { createTestEventWithRegistrants } from "../../helpers/eventsWithRegistrants";

let testUser: testUserType;
let testTasks: (Interface_Task & Document<any, any, Interface_Task>)[];

beforeAll(async () => {
  await connect();
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
  afterEach(() => {
    vi.restoreAllMocks();
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

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

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
          IN_PRODUCTION: true,
        };
      });

      const { updateTask: updateTaskResolverNotFoundError } = await import(
        "../../../src/resolvers/Mutation/updateTask"
      );

      await updateTaskResolverNotFoundError?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(`Translated ${USER_NOT_FOUND_MESSAGE}`);
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_MESSAGE);
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

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
          IN_PRODUCTION: true,
        };
      });

      const { updateTask: updateTaskResolverNotFoundError } = await import(
        "../../../src/resolvers/Mutation/updateTask"
      );

      await updateTaskResolverNotFoundError?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(`Translated task.notFound`);
      expect(spy).toHaveBeenLastCalledWith("task.notFound");
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
        userId: testUser!._id,
      };

      vi.doMock("../../../src/constants", async () => {
        const actualConstants: object = await vi.importActual(
          "../../../src/constants"
        );
        return {
          ...actualConstants,
          IN_PRODUCTION: true,
        };
      });

      const { updateTask: updateTaskResolverNotFoundError } = await import(
        "../../../src/resolvers/Mutation/updateTask"
      );

      await updateTaskResolverNotFoundError?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_MESSAGE}`
      );
      expect(spy).toHaveBeenLastCalledWith(`${USER_NOT_AUTHORIZED_MESSAGE}`);
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
