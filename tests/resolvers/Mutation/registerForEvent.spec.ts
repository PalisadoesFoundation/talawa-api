import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User, EventAttendee } from "../../../src/models";
import type { MutationRegisterForEventArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { registerForEvent as registerForEventResolver } from "../../../src/resolvers/Mutation/registerForEvent";
import {
  EVENT_NOT_FOUND_ERROR,
  REGISTRANT_ALREADY_EXIST_ERROR,
} from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  afterEach,
  vi,
} from "vitest";
import type { TestUserType } from "../../helpers/userAndOrg";
import type { TestEventType } from "../../helpers/events";
import { createTestEventWithRegistrants } from "../../helpers/eventsWithRegistrants";

let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  [testUser, , testEvent] = await createTestEventWithRegistrants();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> registerForEvent", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no event exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);

    try {
      const args: MutationRegisterForEventArgs = {
        id: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser?._id,
      };

      const { registerForEvent: registerForEventResolver } = await import(
        "../../../src/resolvers/Mutation/registerForEvent"
      );

      await registerForEventResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(EVENT_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(EVENT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("If current user is already invited for the event then update the isRegistered to true only", async () => {
    await EventAttendee.deleteOne({
      userId: testUser?._id,
      eventId: testEvent?._id,
    });

    await EventAttendee.create({
      userId: testUser?._id,
      eventId: testEvent?._id,
      isInvited: true,
    });

    await User.updateOne(
      {
        _id: testUser?._id,
      },
      {
        $set: {
          registeredEvents: [],
        },
      },
    );

    const args: MutationRegisterForEventArgs = {
      id: testEvent?._id,
    };

    const context = {
      userId: testUser?._id,
    };

    const registerForEventPayload = await registerForEventResolver?.(
      {},
      args,
      context,
    );
    const registeredUserPayload = await EventAttendee.findOne({
      userId: testUser?._id,
      eventId: testEvent?._id,
    }).lean();

    expect(registerForEventPayload?.isInvited).toBeTruthy();
    expect(registerForEventPayload?.isRegistered).toBeTruthy();
    if (registeredUserPayload) {
      expect(registerForEventPayload).toMatchObject(registeredUserPayload);
    }

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["registeredEvents"])
      .lean();

    expect(updatedTestUser?.registeredEvents).toEqual([testEvent?._id]);
  });

  it(`If user is not invited then directly invite user to event`, async () => {
    await EventAttendee.deleteOne({
      userId: testUser?._id,
      eventId: testEvent?._id,
    });

    await User.updateOne(
      {
        _id: testUser?._id,
      },
      {
        $set: {
          registeredEvents: [],
        },
      },
    );

    const args: MutationRegisterForEventArgs = {
      id: testEvent?._id,
    };

    const context = {
      userId: testUser?._id,
    };

    const registerForEventPayload = await registerForEventResolver?.(
      {},
      args,
      context,
    );
    const registeredUserPayload = await EventAttendee.findOne({
      userId: testUser?._id,
      eventId: testEvent?._id,
    }).lean();

    expect(registerForEventPayload?.isInvited).toBeFalsy();
    expect(registerForEventPayload?.isRegistered).toBeTruthy();
    if (registeredUserPayload) {
      expect(registerForEventPayload).toMatchObject(registeredUserPayload);
    }

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["registeredEvents"])
      .lean();

    expect(updatedTestUser?.registeredEvents).toEqual([testEvent?._id]);
  });

  it(`throws error if user with _id === context.userId is already a registrant of event with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);

    try {
      const args: MutationRegisterForEventArgs = {
        id: testEvent?._id,
      };

      const context = {
        userId: testUser?._id,
      };

      const { registerForEvent: registerForEventResolver } = await import(
        "../../../src/resolvers/Mutation/registerForEvent"
      );

      await registerForEventResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        REGISTRANT_ALREADY_EXIST_ERROR.MESSAGE,
      );
      expect(spy).toBeCalledWith(REGISTRANT_ALREADY_EXIST_ERROR.MESSAGE);
    }
  });
});
