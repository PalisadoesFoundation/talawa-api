import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { EventAttendee, User } from "../../../src/models";
import type { MutationAddEventAttendeeArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_ALREADY_REGISTERED_FOR_EVENT,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import { createTestUser, type TestUserType } from "../../helpers/userAndOrg";
import { createTestEvent, type TestEventType } from "../../helpers/events";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let randomTestUser: TestUserType;
let testEvent: TestEventType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  randomTestUser = await createTestUser();
  [testUser, , testEvent] = await createTestEvent();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> addEventAttendee", () => {
  it(`throws UnauthorisedError if no user exists with _id === context.userId `, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAddEventAttendeeArgs = {
        input: {
          userId: Types.ObjectId().toString(),
          eventId: Types.ObjectId().toString(),
        },
      };

      const context = { userId: Types.ObjectId().toString() };

      const { addEventAttendee: addEventAttendeeResolver } = await import(
        "../../../src/resolvers/Mutation/addEventAttendee"
      );

      const res = await addEventAttendeeResolver?.({}, args, context);

      expect(res).toEqual({
        data: null,
        errors: [
          {
            __typename: "UnauthenticatedError",
            message: USER_NOT_FOUND_ERROR.MESSAGE,
            path: [USER_NOT_FOUND_ERROR.PARAM],
          },
        ],
      });
    } catch (error: any) {
      console.log(error);
    }
  });

  it(`throws NotFoundError if no event exists with _id === args.data.eventId`, async () => {
    try {
      const args: MutationAddEventAttendeeArgs = {
        input: {
          userId: Types.ObjectId().toString(),
          eventId: Types.ObjectId().toString(),
        },
      };

      const context = { userId: randomTestUser!._id };

      const { addEventAttendee: addEventAttendeeResolver } = await import(
        "../../../src/resolvers/Mutation/addEventAttendee"
      );

      const res = await addEventAttendeeResolver?.({}, args, context);
      expect(res).toEqual({
        data: null,
        errors: [
          {
            __typename: "EventNotFoundError",
            message: EVENT_NOT_FOUND_ERROR.MESSAGE,
            path: [EVENT_NOT_FOUND_ERROR.PARAM],
          },
        ],
      });
    } catch (error: any) {
      console.log(error);
    }
  });

  it(`throws Unauthorized error if the current user is not an admin of the  event`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAddEventAttendeeArgs = {
        input: {
          userId: Types.ObjectId().toString(),
          eventId: testEvent!._id,
        },
      };

      const context = { userId: randomTestUser!._id };

      const { addEventAttendee: addEventAttendeeResolver } = await import(
        "../../../src/resolvers/Mutation/addEventAttendee"
      );

      const res = await addEventAttendeeResolver?.({}, args, context);

      expect(res).toEqual({
        data: null,
        errors: [
          {
            __typename: "UnauthorizedError",
            message: USER_NOT_AUTHORIZED_ERROR.MESSAGE,
            path: [USER_NOT_AUTHORIZED_ERROR.PARAM],
          },
        ],
      });
    } catch (error: any) {
      console.log(error);
    }
  });

  it(`throws NotFoundError if the request user with _id = args.data.userId does not exist`, async () => {
    try {
      const args: MutationAddEventAttendeeArgs = {
        input: {
          userId: Types.ObjectId().toString(),
          eventId: testEvent!._id,
        },
      };

      const context = { userId: testUser!._id };

      const { addEventAttendee: addEventAttendeeResolver } = await import(
        "../../../src/resolvers/Mutation/addEventAttendee"
      );

      const res = await addEventAttendeeResolver?.({}, args, context);

      expect(res).toEqual({
        data: null,
        errors: [
          {
            __typename: "UserNotFoundError",
            message: USER_NOT_FOUND_ERROR.MESSAGE,
            path: [USER_NOT_FOUND_ERROR.PARAM],
          },
        ],
      });
    } catch (error: any) {
      console.log(error);
    }
  });

  it(`registers the request user for the event successfully and returns the request user`, async () => {
    const args: MutationAddEventAttendeeArgs = {
      input: {
        userId: testUser!._id,
        eventId: testEvent!._id,
      },
    };

    const context = { userId: testUser!._id };

    const { addEventAttendee: addEventAttendeeResolver } = await import(
      "../../../src/resolvers/Mutation/addEventAttendee"
    );

    const payload = await addEventAttendeeResolver?.({}, args, context);

    const requestUser = await User.findOne({
      _id: testUser!._id,
    }).lean();

    const isUserRegistered = await EventAttendee.exists({
      ...args.input,
    });

    expect(payload?.data).toEqual(requestUser);
    expect(isUserRegistered).toBeTruthy();
  });

  it(`throws error if the request user with _id = args.data.userId is already registered for the event`, async () => {
    try {
      const args: MutationAddEventAttendeeArgs = {
        input: {
          userId: testUser!._id,
          eventId: testEvent!._id,
        },
      };

      const context = { userId: testUser!._id };

      const { addEventAttendee: addEventAttendeeResolver } = await import(
        "../../../src/resolvers/Mutation/addEventAttendee"
      );

      const res = await addEventAttendeeResolver?.({}, args, context);

      expect(res).toEqual({
        data: null,
        errors: [
          {
            __typename: "UserAlreadyAttendeeError",
            message: USER_ALREADY_REGISTERED_FOR_EVENT.MESSAGE,
            path: [USER_ALREADY_REGISTERED_FOR_EVENT.PARAM],
          },
        ],
      });
    } catch (error: any) {
      console.log(error);
    }
  });
});
