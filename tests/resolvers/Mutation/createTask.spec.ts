import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationCreateTaskArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { createTask as createTaskResolver } from "../../../src/resolvers/Mutation/createTask";
import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createAndAssignTestTask } from "../../helpers/task";
import type { TestEventProjectType } from "../../helpers/task";

let testUser: TestUserType;
let testEventProject: TestEventProjectType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message
  );

  [testUser, , , testEventProject] = await createAndAssignTestTask();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createTask", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationCreateTaskArgs = {
        eventProjectId: testEventProject!._id,
        data: {
          title: `Test Task`,
          description: `Test Description`,
          deadline: new Date().toDateString(),
        },
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await createTaskResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no event exists with _id === args.eventId`, async () => {
    try {
      const args: MutationCreateTaskArgs = {
        eventProjectId: Types.ObjectId().toString(),
        data: {
          title: `Test Task`,
          description: `Test Description`,
          deadline: new Date().toDateString(),
        },
      };

      const context = {
        userId: testUser?.id,
      };

      await createTaskResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(EVENT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`creates the task and returns it`, async () => {
    const args: MutationCreateTaskArgs = {
      eventProjectId: testEventProject!.id,
      data: {
        title: "title",
        deadline: new Date().toString(),
        description: "description",
      },
    };

    const context = {
      userId: testUser?._id,
    };

    const createTaskPayload = await createTaskResolver?.({}, args, context);

    expect(createTaskPayload).toEqual(
      expect.objectContaining({
        title: "title",
        description: "description",
      })
    );
    expect(createTaskPayload?.deadline).toBeInstanceOf(Date);
  });
});
