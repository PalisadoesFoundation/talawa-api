import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationCreateEventVolunteerGroupArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestEvent } from "../../helpers/events";
import type { TestEventType } from "../../helpers/events";
import { createTestUser } from "../../helpers/user";
import { Event } from "../../../src/models";

let testUser: TestUserType;
let eventAdminUser: TestUserType;
let testEvent: TestEventType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  [eventAdminUser, , testEvent] = await createTestEvent();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createEventVolunteerGroup", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationCreateEventVolunteerGroupArgs = {
        data: {
          name: "Test group",
          leaderId: testUser?._id,
          volunteerUserIds: [testUser?._id],
          eventId: testEvent?._id,
        },
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      const { createEventVolunteerGroup: createEventVolunteerGroupResolver } =
        await import(
          "../../../src/resolvers/Mutation/createEventVolunteerGroup"
        );

      await createEventVolunteerGroupResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it(`throws NotFoundError if no event with _id === args.data.eventId exists`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationCreateEventVolunteerGroupArgs = {
        data: {
          name: "Test group",
          leaderId: testUser?._id,
          volunteerUserIds: [testUser?._id],
          eventId: new Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { createEventVolunteerGroup: createEventVolunteerGroupResolver } =
        await import(
          "../../../src/resolvers/Mutation/createEventVolunteerGroup"
        );

      await createEventVolunteerGroupResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(EVENT_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(EVENT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws UnauthorizedError if current user is not event admin`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationCreateEventVolunteerGroupArgs = {
        data: {
          name: "Test group",
          leaderId: testUser?._id,
          volunteerUserIds: [testUser?._id],
          eventId: testEvent?._id,
        },
      };

      const context = {
        userId: testUser?.id,
      };

      const { createEventVolunteerGroup: createEventVolunteerGroupResolver } =
        await import(
          "../../../src/resolvers/Mutation/createEventVolunteerGroup"
        );

      await createEventVolunteerGroupResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });

  it(`returns EventVolunteerGroup object if given valid args`, async () => {
    const args: MutationCreateEventVolunteerGroupArgs = {
      data: {
        name: "Test group",
        leaderId: eventAdminUser?._id,
        volunteerUserIds: [testUser?._id],
        eventId: testEvent?._id,
      },
    };

    const context = {
      userId: eventAdminUser?.id,
    };

    const { createEventVolunteerGroup: createEventVolunteerGroupResolver } =
      await import("../../../src/resolvers/Mutation/createEventVolunteerGroup");

    const createdGroup = await createEventVolunteerGroupResolver?.(
      {},
      args,
      context,
    );

    const updatedEvent = await Event.findOne({ _id: testEvent?._id });

    expect(updatedEvent?.volunteerGroups.toString()).toEqual(
      [createdGroup?._id.toString()].toString(),
    );

    expect(createdGroup).toEqual(
      expect.objectContaining({
        name: "Test group",
        event: new Types.ObjectId(testEvent?.id),
        creator: eventAdminUser?._id,
        leader: eventAdminUser?._id,
      }),
    );
  });
});
