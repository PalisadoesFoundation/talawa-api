import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { EventAttendee } from "../../../src/models";
import type {
  MutationCheckInArgs,
  TransactionLog,
} from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_NOT_REGISTERED_FOR_EVENT,
  USER_ALREADY_CHECKED_IN,
  TRANSACTION_LOG_TYPES,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { createTestUser, type TestUserType } from "../../helpers/userAndOrg";
import { type TestEventType } from "../../helpers/events";
import { createTestEventWithRegistrants } from "../../helpers/eventsWithRegistrants";

import { getTransactionLogs } from "../../../src/resolvers/Query/getTransactionLogs";

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
          userId: Types.ObjectId().toString(),
          eventId: Types.ObjectId().toString(),
        },
      };

      const context = { userId: Types.ObjectId().toString() };

      const { checkIn: checkInResolver } = await import(
        "../../../src/resolvers/Mutation/checkIn"
      );

      await checkInResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
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
          userId: Types.ObjectId().toString(),
          eventId: Types.ObjectId().toString(),
        },
      };

      const context = { userId: randomTestUser!._id };

      const { checkIn: checkInResolver } = await import(
        "../../../src/resolvers/Mutation/checkIn"
      );

      await checkInResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${EVENT_NOT_FOUND_ERROR.MESSAGE}`
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
          userId: Types.ObjectId().toString(),
          eventId: testEvent!._id,
        },
      };

      const context = { userId: randomTestUser!._id };

      const { checkIn: checkInResolver } = await import(
        "../../../src/resolvers/Mutation/checkIn"
      );

      await checkInResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`
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
          userId: Types.ObjectId().toString(),
          eventId: testEvent!._id,
        },
      };

      const context = { userId: testUser!._id };

      const { checkIn: checkInResolver } = await import(
        "../../../src/resolvers/Mutation/checkIn"
      );

      await checkInResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`
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
          userId: randomTestUser!._id,
          eventId: testEvent!._id,
        },
      };

      const context = { userId: testUser!._id };

      const { checkIn: checkInResolver } = await import(
        "../../../src/resolvers/Mutation/checkIn"
      );

      await checkInResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_REGISTERED_FOR_EVENT.MESSAGE}`
      );
      expect(spy).toHaveBeenLastCalledWith(
        USER_NOT_REGISTERED_FOR_EVENT.MESSAGE
      );
    }
  });

  it(`Checks the user in successfully`, async () => {
    const args: MutationCheckInArgs = {
      data: {
        userId: testUser!._id,
        eventId: testEvent!._id,
        allotedRoom: "test room",
        allotedSeat: "test seat",
      },
    };

    const context = { userId: testUser!._id };

    const { checkIn: checkInResolver } = await import(
      "../../../src/resolvers/Mutation/checkIn"
    );

    const payload = await checkInResolver?.({}, args, context);

    const eventAttendee = await EventAttendee.findOne({
      eventId: testEvent!._id,
      userId: testUser!._id,
    }).lean();

    expect(eventAttendee!.checkInId).not.toBeNull();
    expect(payload).toMatchObject({
      eventAttendeeId: eventAttendee!._id,
      allotedSeat: "test seat",
      allotedRoom: "test room",
    });

    const mostRecentTransactions = getTransactionLogs!({}, {}, {})!;

    expect((mostRecentTransactions as TransactionLog[])[0]).toMatchObject({
      createdBy: testUser?._id.toString(),
      type: TRANSACTION_LOG_TYPES.UPDATE,
      model: "EventAttendee",
    });

    expect((mostRecentTransactions as TransactionLog[])[1]).toMatchObject({
      createdBy: testUser?._id.toString(),
      type: TRANSACTION_LOG_TYPES.CREATE,
      model: "CheckIn",
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
          userId: testUser!._id,
          eventId: testEvent!._id,
        },
      };

      const context = { userId: testUser!._id };

      const { checkIn: checkInResolver } = await import(
        "../../../src/resolvers/Mutation/checkIn"
      );

      await checkInResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_ALREADY_CHECKED_IN.MESSAGE}`
      );
      expect(spy).toHaveBeenLastCalledWith(USER_ALREADY_CHECKED_IN.MESSAGE);
    }
  });
});
