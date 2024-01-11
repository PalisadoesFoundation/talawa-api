import "dotenv/config";
import { connect, disconnect } from "../../helpers/db";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type {
  MutationAddFeedbackArgs,
  TransactionLog,
} from "../../../src/types/generatedGraphQLTypes";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_CHECKED_IN,
  FEEDBACK_ALREADY_SUBMITTED,
  USER_NOT_REGISTERED_FOR_EVENT,
  TRANSACTION_LOG_TYPES,
} from "./../../../src/constants";
import { type TestUserType, createTestUser } from "./../../helpers/userAndOrg";
import { createTestEvent, type TestEventType } from "../../helpers/events";
import { CheckIn, EventAttendee } from "../../../src/models";
import { getTransactionLogs } from "../../../src/resolvers/Query/getTransactionLogs";

let MONGOOSE_INSTANCE: typeof mongoose;
let randomTestUser: TestUserType;
let testUser: TestUserType;
let testEvent: TestEventType;
let eventAttendeeId: string;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  randomTestUser = await createTestUser();
  [testUser, , testEvent] = await createTestEvent();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> addFeedback", () => {
  it(`throws NotFoundError if no event exists with _id === args.eventId`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAddFeedbackArgs = {
        data: {
          eventId: Types.ObjectId().toString(),
          rating: 4,
          review: "Test Review",
        },
      };

      const context = {
        userId: randomTestUser!._id,
      };

      const { addFeedback: addFeedbackResolver } = await import(
        "../../../src/resolvers/Mutation/addFeedback"
      );

      await addFeedbackResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${EVENT_NOT_FOUND_ERROR.MESSAGE}`
      );
      expect(spy).toHaveBeenLastCalledWith(EVENT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws Error if the user is not registered to attend the event`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAddFeedbackArgs = {
        data: {
          eventId: testEvent!._id,
          rating: 4,
          review: "Test Review",
        },
      };

      const context = {
        userId: testUser!._id,
      };

      const { addFeedback: addFeedbackResolver } = await import(
        "../../../src/resolvers/Mutation/addFeedback"
      );

      await addFeedbackResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_REGISTERED_FOR_EVENT.MESSAGE}`
      );
      expect(spy).toHaveBeenLastCalledWith(
        USER_NOT_REGISTERED_FOR_EVENT.MESSAGE
      );
    }
  });

  it(`throws Error if the user is has not checked in to the event`, async () => {
    const eventAttendee = await EventAttendee.create({
      eventId: testEvent!._id,
      userId: testUser!._id,
    });
    eventAttendeeId = eventAttendee._id;

    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAddFeedbackArgs = {
        data: {
          eventId: testEvent!._id,
          rating: 4,
          review: "Test Review",
        },
      };

      const context = {
        userId: testUser!._id,
      };
      const { addFeedback: addFeedbackResolver } = await import(
        "../../../src/resolvers/Mutation/addFeedback"
      );

      await addFeedbackResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${USER_NOT_CHECKED_IN.MESSAGE}`
      );
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_CHECKED_IN.MESSAGE);
    }
  });

  it(`creates and returns the feedback object correctly if the user has checked in to the event`, async () => {
    const checkIn = await CheckIn.create({
      eventAttendeeId,
    });

    await EventAttendee.findByIdAndUpdate(eventAttendeeId, {
      checkInId: checkIn._id,
    });

    const args: MutationAddFeedbackArgs = {
      data: {
        eventId: testEvent!._id,
        rating: 4,
        review: "Test Review",
      },
    };

    const context = {
      userId: testUser!._id,
    };

    const { addFeedback: addFeedbackResolver } = await import(
      "../../../src/resolvers/Mutation/addFeedback"
    );

    const payload = await addFeedbackResolver?.({}, args, context);

    expect(payload).toMatchObject({
      eventId: testEvent!._id,
      rating: 4,
      review: "Test Review",
    });

    const recentLogs = getTransactionLogs!({}, {}, {})!;

    expect((recentLogs as TransactionLog[])[0]).toMatchObject({
      createdBy: testUser?._id.toString(),
      type: TRANSACTION_LOG_TYPES.CREATE,
      model: "Feedback",
    });

    expect((recentLogs as TransactionLog[])[1]).toMatchObject({
      createdBy: testUser?._id.toString(),
      type: TRANSACTION_LOG_TYPES.UPDATE,
      model: "CheckIn",
    });
  });

  it(`throws Error if the user has already has submitted feedback`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAddFeedbackArgs = {
        data: {
          eventId: testEvent!._id,
          rating: 4,
          review: "Test Review",
        },
      };

      const context = {
        userId: testUser!._id,
      };
      const { addFeedback: addFeedbackResolver } = await import(
        "../../../src/resolvers/Mutation/addFeedback"
      );

      await addFeedbackResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(
        `Translated ${FEEDBACK_ALREADY_SUBMITTED.MESSAGE}`
      );
      expect(spy).toHaveBeenLastCalledWith(FEEDBACK_ALREADY_SUBMITTED.MESSAGE);
    }
  });
});
