import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { User, EventAttendee, AppUserProfile } from "../../../src/models";
import type { MutationRegisterEventAttendeeArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  EVENT_NOT_FOUND_ERROR,
  USER_ALREADY_REGISTERED_FOR_EVENT,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
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
import { createTestUser, type TestUserType } from "../../helpers/userAndOrg";
import type { TestEventType } from "../../helpers/events";
import { createTestEventWithRegistrants } from "../../helpers/eventsWithRegistrants";

let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let randomTestUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  randomTestUser = await createTestUser();
  [testUser, , testEvent] = await createTestEventWithRegistrants();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe(`resolvers -> Mutation - > registerEventAttendee`, () => {
  afterEach(() => {
    vi.doUnmock("../../../src/contants");
    vi.resetModules();
  });

  it(`throws NotFoundError if no user exist with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);

    try {
      const args: MutationRegisterEventAttendeeArgs = {
        data: {
          userId: new Types.ObjectId().toString(),
          eventId: new Types.ObjectId().toString(),
        },
      };

      const context = { userId: new Types.ObjectId().toString() };

      const { registerEventAttendee: registerForEventResolver } = await import(
        "../../../src/resolvers/Mutation/registerEventAttendee"
      );

      await registerForEventResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);

      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no event exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);

    try {
      const args: MutationRegisterEventAttendeeArgs = {
        data: {
          userId: new Types.ObjectId().toString(),
          eventId: new Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: testUser?._id,
      };

      const { registerEventAttendee: registerForEventResolver } = await import(
        "../../../src/resolvers/Mutation/registerEventAttendee"
      );

      await registerForEventResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(EVENT_NOT_FOUND_ERROR.MESSAGE);

      expect(spy).toHaveBeenCalledWith(EVENT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws Unauthorized error if the current user is not an admin of the  event`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);

    try {
      const args: MutationRegisterEventAttendeeArgs = {
        data: {
          userId: new Types.ObjectId().toString(),
          eventId: testEvent?._id,
        },
      };

      const context = {
        userId: randomTestUser?._id,
      };

      const { registerEventAttendee: registerForEventResolver } = await import(
        "../../../src/resolvers/Mutation/registerEventAttendee"
      );

      await registerForEventResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );

      expect(spy).toHaveBeenCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no request user exists with _id === args.data.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);

    try {
      const args: MutationRegisterEventAttendeeArgs = {
        data: {
          userId: new Types.ObjectId().toString(),
          eventId: testEvent?._id,
        },
      };

      const context = {
        userId: testUser?._id,
      };

      const { registerEventAttendee: registerForEventResolver } = await import(
        "../../../src/resolvers/Mutation/registerEventAttendee"
      );

      await registerForEventResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);

      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`If user already invited for the event then update isRegistered to true`, async () => {
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

    const args: MutationRegisterEventAttendeeArgs = {
      data: {
        userId: testUser?._id,
        eventId: testEvent?._id,
      },
    };

    const context = { userId: testUser?._id };

    const { registerEventAttendee: registerForEventResolver } = await import(
      "../../../src/resolvers/Mutation/registerEventAttendee"
    );

    const payload = await registerForEventResolver?.({}, args, context);

    const registeredUser = await EventAttendee.findOne({
      userId: testUser?._id,
      eventId: testEvent?._id,
    }).lean();

    expect(payload?.isInvited).toBeTruthy();
    expect(payload?.isRegistered).toBeTruthy();
    if (registeredUser) {
      expect(payload).toMatchObject(registeredUser);
    }
    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["registeredEvents"])
      .lean();

    expect(updatedTestUser?.registeredEvents).toEqual([testEvent?._id]);
  });

  it(`If user is not already invited for the event, then we should directly registered the user to the event`, async () => {
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

    const args: MutationRegisterEventAttendeeArgs = {
      data: {
        userId: testUser?._id,
        eventId: testEvent?._id,
      },
    };

    const context = { userId: testUser?._id };

    const { registerEventAttendee: registerForEventResolver } = await import(
      "../../../src/resolvers/Mutation/registerEventAttendee"
    );

    const payload = await registerForEventResolver?.({}, args, context);

    const registeredUser = await EventAttendee.findOne({
      userId: testUser?._id,
      eventId: testEvent?._id,
    }).lean();

    expect(payload?.isRegistered).toBeTruthy();
    expect(payload?.isInvited).toBeFalsy();
    if (registeredUser) {
      expect(payload).toMatchObject(registeredUser);
    }

    const updatedTestUser = await User.findOne({
      _id: testUser?._id,
    })
      .select(["registeredEvents"])
      .lean();

    expect(updatedTestUser?.registeredEvents).toEqual([testEvent?._id]);
  });

  it(`throws error if user with _id === context.userId is already a registrant of event with _id === args.id `, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);

    try {
      const args: MutationRegisterEventAttendeeArgs = {
        data: {
          userId: testUser?._id,
          eventId: testEvent?._id,
        },
      };

      const context = {
        userId: testUser?._id,
      };

      const { registerEventAttendee: registerForEventResolver } = await import(
        "../../../src/resolvers/Mutation/registerEventAttendee"
      );

      await registerForEventResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_ALREADY_REGISTERED_FOR_EVENT.MESSAGE,
      );

      expect(spy).toHaveBeenCalledWith(
        USER_ALREADY_REGISTERED_FOR_EVENT.MESSAGE,
      );
    }
  });
  it("throws an error if the user does not have appUserProfile", async () => {
    await AppUserProfile.deleteOne({
      userId: testUser?._id,
    });
    const args: MutationRegisterEventAttendeeArgs = {
      data: {
        userId: testUser?._id,
        eventId: testEvent?._id,
      },
    };

    const context = {
      userId: testUser?._id,
    };

    const { registerEventAttendee: registerForEventResolver } = await import(
      "../../../src/resolvers/Mutation/registerEventAttendee"
    );

    try {
      await registerForEventResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        "i18n is not initialized, try app.use(i18n.init);",
      );
    }
  });
});
