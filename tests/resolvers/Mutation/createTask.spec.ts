import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { Event } from "../../../src/models";
import type { MutationCreateTaskArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { createTask as createTaskResolver } from "../../../src/resolvers/Mutation/createTask";
import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestEventWithRegistrants } from "../../helpers/eventsWithRegistrants";
import type { TestEventType } from "../../helpers/events";

let testUser: TestUserType;
let testEvent: TestEventType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const { requestContext } = await import("../../../src/libraries");
  vi.spyOn(requestContext, "translate").mockImplementation(
    (message) => message
  );
  const temp = await createTestEventWithRegistrants();
  testUser = temp[0];
  testEvent = temp[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createTask", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const args: MutationCreateTaskArgs = {
        eventId: "",
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
        eventId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!.id,
      };

      await createTaskResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(EVENT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`creates the task and returns it`, async () => {
    const args: MutationCreateTaskArgs = {
      eventId: testEvent!.id,
      data: {
        title: "title",
        deadline: new Date().toString(),
        description: "description",
      },
    };

    const context = {
      userId: testUser!._id,
    };

    const createTaskPayload = await createTaskResolver?.({}, args, context);

    expect(createTaskPayload).toEqual(
      expect.objectContaining({
        title: "title",
        description: "description",
      })
    );
    expect(createTaskPayload?.deadline).toBeInstanceOf(Date);

    const testUpdatedEvent = await Event.findOne({
      _id: testEvent!._id,
    })
      .select(["tasks"])
      .lean();

    expect(testUpdatedEvent!.tasks).toEqual([createTaskPayload?._id]);
  });
});
