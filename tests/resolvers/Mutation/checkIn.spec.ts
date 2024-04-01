import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  EVENT_NOT_FOUND_ERROR,
  USER_ALREADY_CHECKED_IN,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_REGISTERED_FOR_EVENT,
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

      const { checkIn: checkInResolver } = await import(
        "../../../src/resolvers/Mutation/checkIn"
      );

      await checkInResolver?.({}, args, context);
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

      const { checkIn: checkInResolver } = await import(
        "../../../src/resolvers/Mutation/checkIn"
      );

      await checkInResolver?.({}, args, context);
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

      const { checkIn: checkInResolver } = await import(
        "../../../src/resolvers/Mutation/checkIn"
      );

      await checkInResolver?.({}, args, context);
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
          eventId: testEvent?._id.toString() ?? "",
        },
      };

      const context = { userId: testUser?._id };

      const { checkIn: checkInResolver } = await import(
        "../../../src/resolvers/Mutation/checkIn"
      );

      await checkInResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws Conflict Error if the request user with _id = args.data.userId is not an attendee of the event with _id = args.data.eventId`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationCheckInArgs = {
        data: {
          userId: randomTestUser?._id,
          eventId: testEvent?._id.toString() ?? "",
        },
      };

      const context = { userId: testUser?._id };

      const { checkIn: checkInResolver } = await import(
        "../../../src/resolvers/Mutation/checkIn"
      );

      await checkInResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_REGISTERED_FOR_EVENT.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(
        USER_NOT_REGISTERED_FOR_EVENT.MESSAGE,
      );
    }
  });

  it(`Checks the user in successfully`, async () => {
    const args: MutationCheckInArgs = {
      data: {
        userId: testUser?._id,
        eventId: testEvent?._id.toString() ?? "",
      },
    };

    const context = { userId: testUser?._id };

    const { checkIn: checkInResolver } = await import(
      "../../../src/resolvers/Mutation/checkIn"
    );

    const payload = await checkInResolver?.({}, args, context);

    const eventAttendee = await EventAttendee.findOne({
      eventId: testEvent?._id,
      userId: testUser?._id,
    }).lean();

    expect(eventAttendee?.checkInId).not.toBeNull();
    expect(eventAttendee?.isCheckedIn).toBeTruthy();
    expect(payload).toMatchObject({
      eventAttendeeId: eventAttendee?._id,
    });
  });

  it(`throws error if the request user with _id = args.data.userId is already checkedIn for the event`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationCheckInArgs = {
        data: {
          userId: testUser?._id,
          eventId: testEvent?._id.toString() ?? "",
        },
      };

      const context = { userId: testUser?._id };

      const { checkIn: checkInResolver } = await import(
        "../../../src/resolvers/Mutation/checkIn"
      );

      await checkInResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_ALREADY_CHECKED_IN.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(USER_ALREADY_CHECKED_IN.MESSAGE);
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
    const { checkIn: checkInResolver } = await import(
      "../../../src/resolvers/Mutation/checkIn"
    );
    try {
      await checkInResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
});
