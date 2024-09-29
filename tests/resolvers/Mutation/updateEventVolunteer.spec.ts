import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationUpdateEventVolunteerArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import {
  USER_NOT_FOUND_ERROR,
  EventVolunteerResponse,
  EVENT_VOLUNTEER_NOT_FOUND_ERROR,
  EVENT_VOLUNTEER_INVITE_USER_MISTMATCH,
} from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  vi,
  afterEach,
} from "vitest";
import type {
  TestEventType,
  TestEventVolunteerType,
} from "../../helpers/events";
import { createTestEventAndVolunteer } from "../../helpers/events";
import { createTestUser } from "../../helpers/user";

let MONGOOSE_INSTANCE: typeof mongoose;
let testEvent: TestEventType;
let testEventVolunteer: TestEventVolunteerType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestEventAndVolunteer();
  testEvent = temp[2];
  testEventVolunteer = temp[3];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> updateEventVolunteer", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });
  it(`throws NotFoundError if no user exists with _id === context.userId `, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateEventVolunteerArgs = {
        id: testEventVolunteer?._id,
        data: {
          response: EventVolunteerResponse.YES,
        },
      };

      const context = { userId: new Types.ObjectId().toString() };

      const { updateEventVolunteer: updateEventVolunteerResolver } =
        await import("../../../src/resolvers/Mutation/updateEventVolunteer");

      await updateEventVolunteerResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws NotFoundError if no event volunteer exists with _id === args.id`, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateEventVolunteerArgs = {
        id: new Types.ObjectId().toString(),
        data: {
          response: EventVolunteerResponse.YES,
        },
      };

      const context = { userId: testEventVolunteer?.userId };

      const { updateEventVolunteer: updateEventVolunteerResolver } =
        await import("../../../src/resolvers/Mutation/updateEventVolunteer");

      await updateEventVolunteerResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(
        EVENT_VOLUNTEER_NOT_FOUND_ERROR.MESSAGE,
      );
      expect((error as Error).message).toEqual(
        `Translated ${EVENT_VOLUNTEER_NOT_FOUND_ERROR.MESSAGE}`,
      );
    }
  });

  it(`throws ConflictError if userId of volunteer is not equal to context.userId `, async () => {
    const { requestContext } = await import("../../../src/libraries");

    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);

    try {
      const args: MutationUpdateEventVolunteerArgs = {
        id: testEventVolunteer?._id,
        data: {
          response: EventVolunteerResponse.YES,
        },
      };

      const testUser2 = await createTestUser();
      const context = { userId: testUser2?._id };
      const { updateEventVolunteer: updateEventVolunteerResolver } =
        await import("../../../src/resolvers/Mutation/updateEventVolunteer");

      await updateEventVolunteerResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenLastCalledWith(
        EVENT_VOLUNTEER_INVITE_USER_MISTMATCH.MESSAGE,
      );
      expect((error as Error).message).toEqual(
        `Translated ${EVENT_VOLUNTEER_INVITE_USER_MISTMATCH.MESSAGE}`,
      );
    }
  });

  it(`updates the Event Volunteer with _id === args.id and returns it`, async () => {
    const args: MutationUpdateEventVolunteerArgs = {
      id: testEventVolunteer?._id,
      data: {
        isAssigned: true,
        response: EventVolunteerResponse.YES,
        isInvited: true,
        eventId: testEvent?._id,
      },
    };

    const context = { userId: testEventVolunteer?.userId };

    const { updateEventVolunteer: updateEventVolunteerResolver } = await import(
      "../../../src/resolvers/Mutation/updateEventVolunteer"
    );

    const updatedEventVolunteer = await updateEventVolunteerResolver?.(
      {},
      args,
      context,
    );

    expect(updatedEventVolunteer).toEqual(
      expect.objectContaining({
        isAssigned: true,
        response: EventVolunteerResponse.YES,
        eventId: testEvent?._id,
        isInvited: true,
      }),
    );
  });

  it(`updates the Event Volunteer with _id === args.id, even if args.data is empty object`, async () => {
    const t = await createTestEventAndVolunteer();
    testEventVolunteer = t[3];
    const args: MutationUpdateEventVolunteerArgs = {
      id: testEventVolunteer?._id,
      data: {},
    };

    const context = { userId: testEventVolunteer?.userId };

    const { updateEventVolunteer: updateEventVolunteerResolver } = await import(
      "../../../src/resolvers/Mutation/updateEventVolunteer"
    );

    const updatedEventVolunteer = await updateEventVolunteerResolver?.(
      {},
      args,
      context,
    );

    expect(updatedEventVolunteer).toEqual(
      expect.objectContaining({
        isAssigned: testEventVolunteer?.isAssigned,
        response: testEventVolunteer?.response,
        eventId: testEventVolunteer?.eventId,
        isInvited: testEventVolunteer?.isInvited,
      }),
    );
  });
});
