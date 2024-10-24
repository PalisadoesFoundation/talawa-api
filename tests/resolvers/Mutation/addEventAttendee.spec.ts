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
  USER_NOT_MEMBER_FOR_ORGANIZATION,
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
    if (testEvent?.organization) {
      const eventOrganizationId = testEvent?.organization._id;
      const userId = randomTestUser?._id;

      await User.updateOne(
        { _id: userId },
        { $addToSet: { joinedOrganizations: eventOrganizationId } },
      );

      const args: MutationAddEventAttendeeArgs = {
        data: {
          userId: userId,
          eventId: testEvent?._id.toString() ?? "",
        },
      };

      const context = { userId: testUser?._id };

      const { addEventAttendee: addEventAttendeeResolver } = await import(
        "../../../src/resolvers/Mutation/addEventAttendee"
      );
      const payload = await addEventAttendeeResolver?.({}, args, context);

      expect(payload).toBeDefined();

      const requestUser = await User.findOne({
        _id: userId?._id,
      }).lean();
      expect(payload).toEqual(expect.objectContaining(requestUser));
      const isUserRegistered = await EventAttendee.exists({
        ...args.data,
      });
      expect(isUserRegistered).toBeTruthy();
    }
  });
  it(`throws UnauthorizedError if the requestUser is not a member of the organization`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    await User.updateOne(
      { _id: testUser?._id },
      { $set: { joinedOrganizations: [] } }, // Make sure the user is not a member of any organization.
    );

    try {
      const args: MutationAddEventAttendeeArgs = {
        data: {
          userId: testUser?._id,
          eventId: testEvent!._id.toString(),
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
          `Translated ${USER_NOT_MEMBER_FOR_ORGANIZATION.MESSAGE}`,
        );
        expect(spy).toHaveBeenLastCalledWith(
          USER_NOT_MEMBER_FOR_ORGANIZATION.MESSAGE,
        );
      }
    }
  });

  it(`throws error if the request user with _id = args.data.userId is already registered for the event`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    await EventAttendee.create({
      userId: testUser?._id.toString(),
      eventId: testEvent?._id.toString(),
    });

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
  it("throws NotFoundError if the user is not found after update", async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    const mockFindByIdAndUpdate = vi
      .spyOn(User, "findByIdAndUpdate")
      .mockResolvedValueOnce(null);

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
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
    mockFindByIdAndUpdate.mockRestore();
  });
});
