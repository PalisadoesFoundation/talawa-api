/* eslint-disable @typescript-eslint/no-non-null-assertion */
import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  EVENT_NOT_FOUND_ERROR,
  USER_ALREADY_REGISTERED_FOR_EVENT,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { AppUserProfile, EventAttendee, User } from "../../../src/models";
import type { MutationAddEventAttendeeArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import { createTestEvent, type TestEventType } from "../../helpers/events";
import { createTestUser, type TestUserType } from "../../helpers/userAndOrg";

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
  it(`throws NotFoundError if no user exists with _id === context.userId `, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAddEventAttendeeArgs = {
        data: {
          userId: new Types.ObjectId().toString(),
          eventId: new Types.ObjectId().toString(),
        },
      };

      const context = { userId: new Types.ObjectId().toString() };

      const { addEventAttendee: addEventAttendeeResolver } = await import(
        "../../../src/resolvers/Mutation/addEventAttendee"
      );

      await addEventAttendeeResolver?.({}, args, context);
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
      const args: MutationAddEventAttendeeArgs = {
        data: {
          userId: new Types.ObjectId().toString(),
          eventId: new Types.ObjectId().toString(),
        },
      };

      const context = { userId: randomTestUser?._id };

      const { addEventAttendee: addEventAttendeeResolver } = await import(
        "../../../src/resolvers/Mutation/addEventAttendee"
      );

      await addEventAttendeeResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${EVENT_NOT_FOUND_ERROR.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(EVENT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws Unauthorized error if the current user is not an admin of the  event`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAddEventAttendeeArgs = {
        data: {
          userId: new Types.ObjectId().toString(),
          eventId: testEvent?._id.toString() ?? "",
        },
      };

      const context = { userId: randomTestUser?._id };

      const { addEventAttendee: addEventAttendeeResolver } = await import(
        "../../../src/resolvers/Mutation/addEventAttendee"
      );

      await addEventAttendeeResolver?.({}, args, context);
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
      const args: MutationAddEventAttendeeArgs = {
        data: {
          userId: new Types.ObjectId().toString(),
          eventId: testEvent?._id.toString() ?? "",
        },
      };

      const context = { userId: testUser?._id };

      const { addEventAttendee: addEventAttendeeResolver } = await import(
        "../../../src/resolvers/Mutation/addEventAttendee"
      );

      await addEventAttendeeResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`registers the request user for the event successfully and returns the request user`, async () => {
    const args: MutationAddEventAttendeeArgs = {
      data: {
        userId: testUser?._id,
        eventId: testEvent?._id.toString() ?? "",
      },
    };

    const context = { userId: testUser?._id };

    const { addEventAttendee: addEventAttendeeResolver } = await import(
      "../../../src/resolvers/Mutation/addEventAttendee"
    );
    process.env.SKIP_ORG_MEMBER_CHECK_TEST = "true";
    const payload = await addEventAttendeeResolver?.({}, args, context);

    const requestUser = await User.findOne({
      _id: testUser?._id,
    }).lean();

    const isUserRegistered = await EventAttendee.exists({
      ...args.data,
    });
    process.env.SKIP_ORG_MEMBER_CHECK_TEST = undefined;
    expect(payload).toEqual(requestUser);
    expect(isUserRegistered).toBeTruthy();
  });

  it(`throws error if the request user with _id = args.data.userId is already registered for the event`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationAddEventAttendeeArgs = {
        data: {
          userId: testUser?._id,
          eventId: testEvent?._id.toString() ?? "",
        },
      };

      const context = { userId: testUser?._id };

      const { addEventAttendee: addEventAttendeeResolver } = await import(
        "../../../src/resolvers/Mutation/addEventAttendee"
      );

      await addEventAttendeeResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_ALREADY_REGISTERED_FOR_EVENT.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(
        USER_ALREADY_REGISTERED_FOR_EVENT.MESSAGE,
      );
    }
  });
  it("throws an error if user does not have appUserProfile", async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);
    await AppUserProfile.deleteOne({
      userId: testUser?._id,
    });
    const args: MutationAddEventAttendeeArgs = {
      data: {
        userId: testUser?._id,
        eventId: testEvent?._id.toString() ?? "",
      },
    };
    const context = { userId: testUser?._id };
    try {
      const { addEventAttendee: addEventAttendeeResolver } = await import(
        "../../../src/resolvers/Mutation/addEventAttendee"
      );
      await addEventAttendeeResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws UnauthorizedError if the requestUser is not a member of the organization`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      // Create a test user who is not a member of the organization
      const args: MutationAddEventAttendeeArgs = {
        data: {
          userId: randomTestUser!._id,
          eventId: testEvent!._id,
        },
      };

      const context = { userId: testUser!._id };

      const { addEventAttendee: addEventAttendeeResolver } = await import(
        "../../../src/resolvers/Mutation/addEventAttendee"
      );

      await addEventAttendeeResolver?.({}, args, context);
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toEqual(
          // `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
          `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
        );
        expect(spy).toHaveBeenLastCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      }
    }
  });
});
