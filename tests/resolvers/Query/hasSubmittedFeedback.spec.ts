import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { CheckIn, EventAttendee } from "../../../src/models";
import type { QueryHasSubmittedFeedbackArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import { createTestEvent, type TestEventType } from "../../helpers/events";
import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_CHECKED_IN,
  USER_NOT_FOUND_ERROR,
  USER_NOT_REGISTERED_FOR_EVENT,
} from "./../../../src/constants";
import { createTestUser, type TestUserType } from "./../../helpers/userAndOrg";

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

describe("resolvers -> Query -> hasSubmittedFeedback", () => {
  it(`throws NotFoundError if no user exists with _id === args.userId `, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: QueryHasSubmittedFeedbackArgs = {
        userId: new Types.ObjectId().toString(),
        eventId: new Types.ObjectId().toString(),
      };

      const context = {};

      const { hasSubmittedFeedback: hasSubmittedFeedbackResolver } =
        await import("../../../src/resolvers/Query/hasSubmittedFeedback");

      await hasSubmittedFeedbackResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError if no event exists with _id === args.eventId`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: QueryHasSubmittedFeedbackArgs = {
        userId: randomTestUser?._id,
        eventId: new Types.ObjectId().toString(),
      };

      const context = {};

      const { hasSubmittedFeedback: hasSubmittedFeedbackResolver } =
        await import("../../../src/resolvers/Query/hasSubmittedFeedback");

      await hasSubmittedFeedbackResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${EVENT_NOT_FOUND_ERROR.MESSAGE}`,
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
      const args: QueryHasSubmittedFeedbackArgs = {
        userId: testUser?._id,
        eventId: testEvent?._id.toString() ?? "",
      };

      const context = {};

      const { hasSubmittedFeedback: hasSubmittedFeedbackResolver } =
        await import("../../../src/resolvers/Query/hasSubmittedFeedback");

      await hasSubmittedFeedbackResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_REGISTERED_FOR_EVENT.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(
        USER_NOT_REGISTERED_FOR_EVENT.MESSAGE,
      );
    }
  });

  it(`throws Error if the user is has not checked in to the event`, async () => {
    const eventAttendee = await EventAttendee.create({
      eventId: testEvent?._id,
      userId: testUser?._id,
    });
    eventAttendeeId = eventAttendee._id.toString();

    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: QueryHasSubmittedFeedbackArgs = {
        userId: testUser?._id,
        eventId: testEvent?._id.toString() ?? "",
      };

      const context = {};

      const { hasSubmittedFeedback: hasSubmittedFeedbackResolver } =
        await import("../../../src/resolvers/Query/hasSubmittedFeedback");

      await hasSubmittedFeedbackResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_CHECKED_IN.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_CHECKED_IN.MESSAGE);
    }
  });

  it(`returns the feedback status correctly if the user has checked in to the event`, async () => {
    const checkIn = await CheckIn.create({
      eventAttendeeId,
      feedbackSubmitted: true,
    });

    await EventAttendee.findByIdAndUpdate(eventAttendeeId, {
      checkInId: checkIn._id,
    });

    const args: QueryHasSubmittedFeedbackArgs = {
      userId: testUser?._id,
      eventId: testEvent?._id.toString() ?? "",
    };

    const context = {};

    const { hasSubmittedFeedback: hasSubmittedFeedbackResolver } = await import(
      "../../../src/resolvers/Query/hasSubmittedFeedback"
    );

    const payload = await hasSubmittedFeedbackResolver?.({}, args, context);
    expect(payload).toBeTruthy();
  });
});
