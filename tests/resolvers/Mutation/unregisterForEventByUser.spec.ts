import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { EventAttendee, User } from "../../../src/models";
import type { MutationUnregisterForEventByUserArgs } from "../../../src/types/generatedGraphQLTypes";
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
  USER_ALREADY_UNREGISTERED_ERROR,
} from "../../../src/constants";
import type { TestEventType } from "../../helpers/events";
import { createTestEvent } from "../../helpers/events";
import type { TestUserType } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testEvent: TestEventType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , testEvent] = await createTestEvent();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

afterEach(() => {
  vi.doUnmock("../../../src/constants");
  vi.resetModules();
});

describe("resolvers -> Mutation -> unregisterForEventByUser", () => {
  it(`throws NotFoundError if no event exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationUnregisterForEventByUserArgs = {
        id: new Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?._id,
      };

      const { unregisterForEventByUser: unregisterForEventByUserResolver } =
        await import(
          "../../../src/resolvers/Mutation/unregisterForEventByUser"
        );

      await unregisterForEventByUserResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(EVENT_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${EVENT_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws NotFoundError if current user with _id === context.userId is not a registrant of event with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    try {
      const args: MutationUnregisterForEventByUserArgs = {
        id: testEvent?._id.toString() ?? "",
      };

      const context = {
        userId: testUser?._id,
      };

      const { unregisterForEventByUser: unregisterForEventByUserResolver } =
        await import(
          "../../../src/resolvers/Mutation/unregisterForEventByUser"
        );

      await unregisterForEventByUserResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(USER_ALREADY_UNREGISTERED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_ALREADY_UNREGISTERED_ERROR.MESSAGE}`,
      );
    }
  });

  it(`unregisters current user with _id === context.userId from event with
  _id === args.id`, async () => {
    await EventAttendee.create({
      userId: testUser?._id,
      eventId: testEvent?._id,
    });

    await User.updateOne(
      {
        _id: testUser?._id,
      },
      {
        $push: {
          registeredEvents: testEvent?._id,
        },
      },
    );

    const args: MutationUnregisterForEventByUserArgs = {
      id: testEvent?._id.toString() ?? "",
    };

    const context = {
      userId: testUser?._id,
    };

    const { unregisterForEventByUser: unregisterForEventByUserResolver } =
      await import("../../../src/resolvers/Mutation/unregisterForEventByUser");

    await unregisterForEventByUserResolver?.({}, args, context);

    const isUserRegistered = await EventAttendee.exists({
      userId: testUser?._id,
      eventId: testEvent?._id,
    });

    expect(isUserRegistered).toBeFalsy();
  });
});
