import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  ATTENDEE_NOT_FOUND,
  EVENT_NOT_FOUND_ERROR,
  USER_ALREADY_CHECKED_OUT,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_CHECKED_IN,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { AppUserProfile, EventAttendee } from "../../../src/models";
import type { MutationCheckInArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import { type TestEventType } from "../../helpers/events";
import { createTestEventWithRegistrants } from "../../helpers/eventsWithRegistrants";
import { createTestUser, type TestUserType } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let randomTestUser: TestUserType;
let testEvent: TestEventType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  randomTestUser = await createTestUser();
  [testUser, , testEvent] = await createTestEventWithRegistrants();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> checkIn", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId `, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationCheckInArgs = {
        data: {
          userId: new Types.ObjectId().toString(),
          eventId: new Types.ObjectId().toString(),
        },
      };

      const context = { userId: new Types.ObjectId().toString() };

      const { checkOut: checkOutResolver } = await import(
        "../../../src/resolvers/Mutation/checkOut"
      );

      await checkOutResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no event exists with _id === args.data.eventId`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationCheckInArgs = {
        data: {
          userId: new Types.ObjectId().toString(),
          eventId: new Types.ObjectId().toString(),
        },
      };

      const context = { userId: randomTestUser?._id };

      const { checkOut: checkOutResolver } = await import(
        "../../../src/resolvers/Mutation/checkOut"
      );

      await checkOutResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${EVENT_NOT_FOUND_ERROR.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(EVENT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws Unauthorized Error if the current user is not an admin of the  event`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationCheckInArgs = {
        data: {
          userId: new Types.ObjectId().toString(),
          eventId: testEvent?._id.toString() ?? "",
        },
      };

      const context = { userId: randomTestUser?._id };

      const { checkOut: checkOutResolver } = await import(
        "../../../src/resolvers/Mutation/checkOut"
      );

      await checkOutResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if the request user with _id = args.data.userId does not exist`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationCheckInArgs = {
        data: {
          userId: new Types.ObjectId().toString(),
          eventId: testEvent?._id.toString(),
        },
      };

      const context = { userId: testUser?._id };

      const { checkOut: checkOutResolver } = await import(
        "../../../src/resolvers/Mutation/checkOut"
      );

      await checkOutResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws Conflict Error if the request user with _id = args.data.userId is not checked in to the event`, async () => {
    await EventAttendee.findOneAndUpdate(
      { userId: testUser?._id },
      {
        isCheckedIn: false,
      },
    );
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationCheckInArgs = {
        data: {
          userId: testUser?._id,
          eventId: testEvent?._id.toString(),
        },
      };

      const context = { userId: testUser?._id };

      const { checkOut: checkOutResolver } = await import(
        "../../../src/resolvers/Mutation/checkOut"
      );

      await checkOutResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_CHECKED_IN.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_CHECKED_IN.MESSAGE);
    }
  });

  it(`Check out the user successfully`, async () => {
    await EventAttendee.findOneAndUpdate(
      { userId: testUser?._id },
      {
        isCheckedIn: true,
        isCheckedOut: false,
      },
    );
    const args: MutationCheckInArgs = {
      data: {
        userId: testUser?._id,
        eventId: testEvent?._id.toString() ?? "",
      },
    };

    const context = { userId: testUser?._id };

    const { checkOut: checkOutResolver } = await import(
      "../../../src/resolvers/Mutation/checkOut"
    );

    const payload = await checkOutResolver?.({}, args, context);

    const eventAttendee = await EventAttendee.findOne({
      eventId: testEvent?._id,
      userId: testUser?._id,
    }).lean();

    expect(eventAttendee?.isCheckedOut).not.toBeNull();
    expect(eventAttendee?.isCheckedOut).toBeTruthy();
    expect(payload).toMatchObject({
      eventAttendeeId: eventAttendee?._id,
    });
  });

  it(`throws Conflict Error if the request user with _id = args.data.userId is already checked out from the event`, async () => {
    await EventAttendee.findOneAndUpdate(
      { userId: testUser?._id },
      {
        isCheckedOut: true,
      },
    );
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationCheckInArgs = {
        data: {
          userId: testUser?._id,
          eventId: testEvent?._id.toString(),
        },
      };

      const context = { userId: testUser?._id };

      const { checkOut: checkOutResolver } = await import(
        "../../../src/resolvers/Mutation/checkOut"
      );

      await checkOutResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_ALREADY_CHECKED_OUT.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(USER_ALREADY_CHECKED_OUT.MESSAGE);
    }
  });

  it(`throws NotFoundError if the request user with _id = args.data.userId is not an event attendee of the event with _id = args.data.eventId`, async () => {
    await EventAttendee.deleteOne({
      userId: testUser?._id,
    });
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationCheckInArgs = {
        data: {
          userId: testUser?._id,
          eventId: testEvent?._id.toString(),
        },
      };

      const context = { userId: testUser?._id };

      const { checkOut: checkOutResolver } = await import(
        "../../../src/resolvers/Mutation/checkOut"
      );

      await checkOutResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${ATTENDEE_NOT_FOUND.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(ATTENDEE_NOT_FOUND.MESSAGE);
    }
  });

  it("throws an error if user does not have appUserProfile", async () => {
    await AppUserProfile.deleteOne({
      userId: testUser?._id,
    });
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    const args: MutationCheckInArgs = {
      data: {
        userId: testUser?._id,
        eventId: testEvent?._id.toString() ?? "",
      },
    };
    const context = { userId: testUser?._id };
    const { checkOut: checkOutResolver } = await import(
      "../../../src/resolvers/Mutation/checkOut"
    );
    try {
      await checkOutResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
});
