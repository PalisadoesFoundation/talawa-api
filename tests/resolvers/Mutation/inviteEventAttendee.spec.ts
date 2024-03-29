import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationInviteEventAttendeeArgs } from "../../../src/types/generatedGraphQLTypes";
import { AppUserProfile, EventAttendee } from "../../../src/models";
import { connect, disconnect } from "../../helpers/db";

import {
  EVENT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  USER_ALREADY_INVITED_FOR_EVENT,
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

describe("resolvers -> Mutations -> inviteEventAttendee", () => {
  it("throws NotFoundError if no user exist with _id === context.userId", async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationInviteEventAttendeeArgs = {
        data: {
          userId: new Types.ObjectId().toString(),
          eventId: new Types.ObjectId().toString(),
        },
      };

      const context = { userId: new Types.ObjectId().toString() };

      const { inviteEventAttendee: inviteEventAttendeeResolver } = await import(
        "../../../src/resolvers/Mutation/inviteEventAttendee"
      );

      await inviteEventAttendeeResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );

      expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("throws NotFoundError if no event exists with _id === args.data.eventId", async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationInviteEventAttendeeArgs = {
        data: {
          userId: new Types.ObjectId().toString(),
          eventId: new Types.ObjectId().toString(),
        },
      };

      const context = { userId: randomTestUser?._id };

      const { inviteEventAttendee: inviteEventAttendeeResolver } = await import(
        "../../../src/resolvers/Mutation/inviteEventAttendee"
      );

      await inviteEventAttendeeResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${EVENT_NOT_FOUND_ERROR.MESSAGE}`,
      );

      expect(spy).toHaveBeenCalledWith(EVENT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws Unauthorized error if the current user is not an admin of the  event`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationInviteEventAttendeeArgs = {
        data: {
          userId: new Types.ObjectId().toString(),
          eventId: testEvent?._id,
        },
      };

      const context = { userId: randomTestUser?._id };

      const { inviteEventAttendee: inviteEventAttendeeResolver } = await import(
        "../../../src/resolvers/Mutation/inviteEventAttendee"
      );

      await inviteEventAttendeeResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
  });

  it(`throws Unauthorized error if the current user is not an admin of the  event`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationInviteEventAttendeeArgs = {
        data: {
          userId: new Types.ObjectId().toString(),
          eventId: testEvent?._id,
        },
      };

      const context = { userId: testUser?._id };

      const { inviteEventAttendee: inviteEventAttendeeResolver } = await import(
        "../../../src/resolvers/Mutation/inviteEventAttendee"
      );

      await inviteEventAttendeeResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("invite the request user for the event successfully and returns the request user", async () => {
    const args: MutationInviteEventAttendeeArgs = {
      data: {
        userId: testUser?.id,
        eventId: testEvent?._id,
      },
    };

    const context = { userId: testUser?._id };

    try {
      const { inviteEventAttendee: inviteEventAttendeeResolver } = await import(
        "../../../src/resolvers/Mutation/inviteEventAttendee"
      );

      const payload = await inviteEventAttendeeResolver?.({}, args, context);

      const invitedUser = await EventAttendee.findOne({
        ...args.data,
      }).lean();

      const userAlreadyInvited = await EventAttendee.exists({
        ...args.data,
      });

      expect(payload).toEqual(invitedUser);
      expect(userAlreadyInvited).toBeTruthy();
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });

  it("throws error if the reqest user with _id = args.data.userId is already invited for the event", async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationInviteEventAttendeeArgs = {
        data: {
          userId: testUser?.id,
          eventId: testEvent?._id,
        },
      };

      const context = { userId: testUser?._id };

      const { inviteEventAttendee: inviteEventAttendeeResolver } = await import(
        "../../../src/resolvers/Mutation/inviteEventAttendee"
      );

      await inviteEventAttendeeResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        `Translated ${USER_ALREADY_INVITED_FOR_EVENT.MESSAGE}`,
      );
      expect(spy).toHaveBeenLastCalledWith(
        USER_ALREADY_INVITED_FOR_EVENT.MESSAGE,
      );
    }
  });

  it("throws an error if the user does not have appUserProfile", async () => {
    await AppUserProfile.deleteOne({
      userId: testUser?._id,
    });
    const args: MutationInviteEventAttendeeArgs = {
      data: {
        userId: testUser?.id,
        eventId: testEvent?._id,
      },
    };

    const context = { userId: testUser?._id };

    const { inviteEventAttendee: inviteEventAttendeeResolver } = await import(
      "../../../src/resolvers/Mutation/inviteEventAttendee"
    );

    try {
      await inviteEventAttendeeResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        "i18n is not initialized, try app.use(i18n.init);",
      );
    }
  });
});
