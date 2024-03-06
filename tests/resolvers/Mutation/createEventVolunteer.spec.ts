import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationCreateEventVolunteerArgs } from "../../../src/types/generatedGraphQLTypes";
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
  EVENT_VOLUNTEER_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestEvent } from "../../helpers/events";
import type { TestEventType } from "../../helpers/events";
import { createTestUser } from "../../helpers/user";

let testUser1: TestUserType, testUser2: TestUserType;
let testEvent: TestEventType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser2 = await createTestUser();
  testUser1 = await createTestUser();
  [, , testEvent] = await createTestEvent();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createEventVolunteer", () => {
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
      const args: MutationCreateEventVolunteerArgs = {
        data: {
          userId: testUser2?._id,
          eventId: testEvent?._id,
        },
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      const { createEventVolunteer: createEventVolunteerResolver } =
        await import("../../../src/resolvers/Mutation/createEventVolunteer");

      await createEventVolunteerResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
  it(`throws NotFoundError if no user with _id === args.userId exists`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationCreateEventVolunteerArgs = {
        data: {
          userId: new Types.ObjectId().toString(),
          eventId: testEvent?._id,
        },
      };

      const context = {
        userId: testUser1?.id,
      };

      const { createEventVolunteer: createEventVolunteerResolver } =
        await import("../../../src/resolvers/Mutation/createEventVolunteer");

      await createEventVolunteerResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(EVENT_VOLUNTEER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        EVENT_VOLUNTEER_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it(`throws NotFoundError if no event exists with _id === args.eventId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationCreateEventVolunteerArgs = {
        data: {
          userId: testUser2?._id,
          eventId: new Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: testUser1?.id,
      };

      const { createEventVolunteer: createEventVolunteerResolver } =
        await import("../../../src/resolvers/Mutation/createEventVolunteer");

      await createEventVolunteerResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(EVENT_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(EVENT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`returns EventVolunteer object if valid userId and eventId in args`, async () => {
    const args: MutationCreateEventVolunteerArgs = {
      data: {
        userId: testUser2?._id,
        eventId: testEvent?._id,
      },
    };

    const context = {
      userId: testUser1?.id,
    };

    const { createEventVolunteer: createEventVolunteerResolver } = await import(
      "../../../src/resolvers/Mutation/createEventVolunteer"
    );

    const createdVolunteer = await createEventVolunteerResolver?.(
      {},
      args,
      context,
    );

    expect(createdVolunteer).toEqual(
      expect.objectContaining({
        eventId: new Types.ObjectId(testEvent?.id),
        userId: testUser2?._id,
        creatorId: testUser1?._id,
        isInvited: true,
        isAssigned: false,
      }),
    );
  });
});
